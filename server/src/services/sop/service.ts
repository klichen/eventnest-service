import { Postgres, type NeonConnection } from "../../db";
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
export async function upsertSOPClubs() {
  const db = Postgres.connection;
  return tryCatch(async () => {
    const sopClubs = await fetchAndValidateSOPData();
    let counter = 10;
    for (const sopClub of sopClubs) {
      await upsertSingleClub(sopClub, db);
      counter -= 1;
      if (counter === 0) {
        break;
      }
    }
    console.log(
      `Successfully upserted ${sopClubs.length} clubs from SOP data.`
    );
  });
}

/**
 * Upsert a single club and its relationships within its own transaction.
 * Uses onConflictDoUpdate for upserts and onConflictDoNothing for the composite tables.
 */
async function upsertSingleClub(sopClub: Club, db: NeonConnection) {
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
