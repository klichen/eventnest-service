import { Postgres, type PgConnection } from "../../db";
import {
  clubs,
  clubsCampuses,
  campuses,
  clubAreasOfInterest,
  areasOfInterest,
  clubInstagramTokens,
} from "../../db/schema";
import { and, eq, ilike, inArray, or, SQL, sql } from "drizzle-orm";
import type { ClubEntity, ClubSummaryEntity } from "./entities";
import type { ClubsFilter } from "../../services/clubs/schemas";

export interface ClubRecord {
  id: string;
  name: string;
  description?: string | null;
  groupUrl?: string | null;
  groupEmail?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  instagramUsername?: string | null;
  lastModifiedDate: Date;
  externalId: number;
}

export class ClubsRepo {
  private db: PgConnection;

  constructor() {
    // TODO use dependency injection for db
    const pg = new Postgres();
    this.db = pg.connection;
  }

  private createFilters(f: ClubsFilter): SQL[] {
    const filters: SQL[] = [];
    if (f.campusFilter?.length) {
      filters.push(sql`
          EXISTS (
            SELECT 1
            FROM ${clubsCampuses} cc2
            JOIN ${campuses} cam2 ON cam2.id = cc2.campus_id
            WHERE cc2.club_id = ${clubs.id}
              AND ${inArray(sql.raw("cam2.key"), f.campusFilter)}
          )
        `);
    }

    if (f.interestsFilter?.length) {
      filters.push(sql`
          EXISTS (
            SELECT 1
            FROM ${clubAreasOfInterest} caoi2
            JOIN ${areasOfInterest}     aoi2  ON aoi2.id = caoi2.interest_id
            WHERE caoi2.club_id = ${clubs.id}
              AND ${inArray(sql.raw("aoi2.key"), f.interestsFilter)}
          )
        `);
    }

    if (f.searchFilter) {
      const searchQuery = `%${f.searchFilter.trim()}%`;
      const searchFilter = or(
        ilike(clubs.name, searchQuery),
        ilike(clubs.description, searchQuery)
      );
      if (searchFilter) {
        filters.push(searchFilter);
      }
    }
    return filters;
  }

  async findClubs(
    offset: number,
    limit: number,
    reqFilters: ClubsFilter
  ): Promise<ClubSummaryEntity[] | Error> {
    try {
      const filters = this.createFilters(reqFilters);
      const res = await this.db
        .select({
          id: clubs.id,
          name: clubs.name,
          description: clubs.description,
          campuses: sql<string | null>`
        STRING_AGG(DISTINCT ${campuses.value}, ',')
        `.as("campuses"),
          areasOfInterest: sql<string | null>`
        STRING_AGG(DISTINCT ${areasOfInterest.value}, ',')
        `.as("areas_of_interest"),
          connectedToEventNest: sql<boolean>`
        EXISTS (
          SELECT 1
          FROM ${clubInstagramTokens} AS cit
          WHERE cit.club_id = ${clubs.id}
        )
        `.as("connected_to_event_nest"),
        })
        .from(clubs)
        .leftJoin(clubsCampuses, eq(clubsCampuses.clubId, clubs.id))
        .leftJoin(campuses, eq(campuses.id, clubsCampuses.campusId))
        .leftJoin(clubAreasOfInterest, eq(clubAreasOfInterest.clubId, clubs.id))
        .leftJoin(
          areasOfInterest,
          eq(areasOfInterest.id, clubAreasOfInterest.interestId)
        )
        .where(and(...filters))
        .groupBy(clubs.id, clubs.name)
        .orderBy(clubs.name, clubs.id)
        .limit(limit)
        .offset(offset);

      const clubSummaryArray: ClubSummaryEntity[] = res.map((c) => {
        const {
          campuses: campusesAgg,
          areasOfInterest: areasOfInterestAgg,
          ...rest
        } = c;
        const campusesArr = campusesAgg ? campusesAgg.split(",") : [];
        const areasOfInterestArr = areasOfInterestAgg
          ? areasOfInterestAgg.split(",")
          : [];

        return {
          ...rest,
          campuses: campusesArr,
          areasOfInterest: areasOfInterestArr,
        };
      });

      return clubSummaryArray;
    } catch (error) {
      return new Error(`Something went wrong fetching Clubs: ${error}`);
    }
  }

  async countClubs(reqFilters: ClubsFilter): Promise<number> {
    const filters = this.createFilters(reqFilters);

    const res = this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(clubs)
      .where(and(...filters));

    const [{ total }] = await res;
    return Number(total);
  }

  /**
   * Fetch a club by its UUID.
   */
  async findById(id: string): Promise<ClubEntity | undefined | Error> {
    try {
      const res = await this.db
        .select({
          id: clubs.id,
          name: clubs.name,
          description: clubs.description,
          groupUrl: clubs.groupUrl,
          groupEmail: clubs.groupEmail,
          facebookUrl: clubs.facebookUrl,
          twitterUrl: clubs.twitterUrl,
          instagramUrl: clubs.instagramUrl,
          websiteUrl: clubs.websiteUrl,
          instagramUsername: clubs.instagramUsername,
          campuses: sql<string | null>`
        STRING_AGG(DISTINCT ${campuses.value}, ',')
        `.as("campuses"),
          areasOfInterest: sql<string | null>`
        STRING_AGG(DISTINCT ${areasOfInterest.value}, ',')
        `.as("areas_of_interest"),
          connectedToEventNest: sql<boolean>`
        EXISTS (
          SELECT 1
          FROM ${clubInstagramTokens} AS cit
          WHERE cit.club_id = ${clubs.id}
        )
        `.as("connected_to_event_nest"),
        })
        .from(clubs)
        .leftJoin(clubsCampuses, eq(clubsCampuses.clubId, clubs.id))
        .leftJoin(campuses, eq(campuses.id, clubsCampuses.campusId))
        .leftJoin(clubAreasOfInterest, eq(clubAreasOfInterest.clubId, clubs.id))
        .leftJoin(
          areasOfInterest,
          eq(areasOfInterest.id, clubAreasOfInterest.interestId)
        )
        .where(eq(clubs.id, id))
        .groupBy(clubs.id, clubs.name);

      if (res.length === 0) return undefined;

      const {
        campuses: campusesAgg,
        areasOfInterest: areasOfInterestAgg,
        ...rest
      } = res[0];

      const campusesArr = campusesAgg ? campusesAgg.split(",") : [];
      const areasOfInterestArr = areasOfInterestAgg
        ? areasOfInterestAgg.split(",")
        : [];

      return {
        ...rest,
        campuses: campusesArr,
        areasOfInterest: areasOfInterestArr,
      };
    } catch (error) {
      return new Error(`Something went wrong fetching Event ${id}: ${error}`);
    }
  }

  // /**
  //  * Fetch a club by its externalId (id from SOP)
  //  */
  // async findByExternalId(externalId: number): Promise<ClubRecord | undefined> {
  //   const [row] = await this.db
  //     .select()
  //     .from(clubs)
  //     .where(eq(clubs.externalId, externalId));
  //   return row;
  // }

  /**
   * Fetch a club by its instagramUsername.
   */
  async findByInstagramUsername(
    instagramUsername: string
  ): Promise<ClubRecord | undefined> {
    const [row] = await this.db
      .select()
      .from(clubs)
      .where(eq(clubs.instagramUsername, instagramUsername));
    return row;
  }

  /**
   * Delete a club by its UUID and cascade-cleanup.
   * (Assuming foreign keys with ON DELETE CASCADE handle related tables.)
   */
  //   async deleteById(id: string): Promise<void> {
  //     await this.db.delete(clubs).where(eq(clubs.id, id));
  //   }
}
