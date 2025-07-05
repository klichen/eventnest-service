import { Postgres, type PgConnection } from "../../db";
import { clubs, clubAreasOfInterest, clubsCampuses } from "../../db/schema";
import { sql } from "drizzle-orm";
import { tryCatch } from "../../utils/errors";
import { ClubArraySchema, type Club } from "./types";
import { extractInstagramUsername } from "../../utils/helpers";

/**
 * Fetch from SOP public API and validate the data using Zod.
 */
export async function fetchAndValidateSOPData(): Promise<Club[]> {
  const url = "https://sop.utoronto.ca/wp-json/sop/v1/api/public";
  const res = await fetch(url);
  const data = await res.json();
  const parseResult = ClubArraySchema.safeParse(data);
  if (!parseResult.success) {
    console.error(
      "SOP API returned something we did not expect:",
      parseResult.error,
      "\n maybe their public API has been updated"
    );
    throw new Error("Invalid SOP data shape");
  }
  return parseResult.data;
}

/**
 * Upsert all clubs and their related data (areas_of_interest, campuses).
 * Each club's upsert occurs in its own transaction.
 */
// TODO - CRON JOB > weekly on Sundays at 3am
export async function syncSOPClubs(isDev = false) {
  const db = new Postgres();
  return tryCatch(async () => {
    const sopClubs = await fetchAndValidateSOPData();
    const clubsToUpsert = isDev ? sopClubs.slice(0, 10) : sopClubs;
    for (const sopClub of clubsToUpsert) {
      await upsertSingleClub(sopClub, db.connection);
    }
    console.log(
      `Successfully upserted ${clubsToUpsert.length} clubs from SOP data.`
    );
    db.close();
  });
}

/**
 * Upsert a single club and its relationships within its own transaction.
 * Uses onConflictDoUpdate for upserts and onConflictDoNothing for the composite tables.
 */
async function upsertSingleClub(sopClub: Club, db: PgConnection) {
  await db.transaction(async (tx) => {
    // Prepare club data.
    const instagramUrl = sopClub.social_Media?.instagram;
    const instagramUsername = instagramUrl
      ? extractInstagramUsername(instagramUrl)
      : null;
    const sopClubData = {
      externalId: sopClub.id,
      name: sopClub.name ?? "",
      description: sopClub.description ?? "",
      groupUrl: sopClub.group_Url ?? null,
      groupEmail: sopClub.group_Email ?? null,
      facebookUrl: sopClub.social_Media?.facebook ?? null,
      twitterUrl: sopClub.social_Media?.twitter ?? null,
      instagramUrl: instagramUrl ?? null,
      websiteUrl: sopClub.social_Media?.website ?? null,
      instagramUsername,
      lastModifiedDate: sopClub.lastModifiedDate
        ? new Date(sopClub.lastModifiedDate)
        : new Date(),
    };

    // Upsert the club using onConflictDoUpdate.
    const clubUpsertResult = await tx
      .insert(clubs)
      .values(sopClubData)
      .onConflictDoUpdate({
        target: clubs.id,
        set: {
          name: sopClub.name,
          description: sopClub.description,
          groupUrl: sopClub.group_Url,
          groupEmail: sopClub.group_Email,
          facebookUrl: sopClub.social_Media?.facebook,
          twitterUrl: sopClub.social_Media?.twitter,
          instagramUrl: instagramUrl,
          websiteUrl: sopClub.social_Media?.website,
          instagramUsername,
          lastModifiedDate: sopClub.lastModifiedDate
            ? new Date(sopClub.lastModifiedDate)
            : new Date(),
        },
        setWhere: sql`${clubs.lastModifiedDate} < ${sopClub.lastModifiedDate}`,
      })
      .returning({ insertedId: clubs.id });

    if (clubUpsertResult.length === 0) {
      throw new Error("Failed to upsert club");
    }
    const clubId = clubUpsertResult[0].insertedId;

    // Upsert the club's areas of interest.
    if (sopClub.areas_Of_Interest?.length) {
      for (const interest of sopClub.areas_Of_Interest) {
        // Insert into the junction table (club_areas_of_interest).
        await tx
          .insert(clubAreasOfInterest)
          .values({
            clubId,
            interestId: interest.id,
          })
          .onConflictDoNothing();
      }
    }

    // Upsert the club's campuses.
    if (sopClub.campus?.length) {
      for (const campusItem of sopClub.campus) {
        // Insert into the junction table (clubs_campuses).
        await tx
          .insert(clubsCampuses)
          .values({
            clubId,
            campusId: campusItem.id,
          })
          .onConflictDoNothing();
      }
    }
  });
}
