import { Postgres, type PgConnection } from "../../db";
import {
  areasOfInterest,
  campuses,
  clubAreasOfInterest,
  clubs,
  clubsCampuses,
  events,
  instagramPosts,
} from "../../db/schema";
import type { EventsFilters } from "../../services/events/schemas";
import {
  and,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  SQL,
  sql,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import type { EventEntity } from "./entities";

export type EventRecord = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;

export class EventsRepo {
  private db: PgConnection;

  // TODO DI for postgres connection
  constructor() {
    const pg = new Postgres();
    this.db = pg.connection;
  }

  async findEvents(
    offset: number,
    limit: number,
    reqFilters: EventsFilters
  ): Promise<EventEntity[] | Error> {
    try {
      const filters = this.createFilters(reqFilters);

      const rows = await this.db
        .select({
          id: events.id,
          clubId: instagramPosts.clubId,
          title: events.title,
          description: events.description,
          location: events.location,
          incentives: events.incentives,
          startDatetime: events.startDatetime,
          endDatetime: events.endDatetime,
          // Aggregate human-friendly campus VALUES for display
          campuses: sql<string | null>`
          STRING_AGG(DISTINCT ${campuses.value}, ',')
        `.as("campuses"),
        })
        .from(events)
        // Event -> Post -> Club
        .innerJoin(instagramPosts, eq(instagramPosts.id, events.postId))
        .innerJoin(clubs, eq(clubs.id, instagramPosts.clubId))
        // Joins for campus aggregation
        .leftJoin(clubsCampuses, eq(clubsCampuses.clubId, clubs.id))
        .leftJoin(campuses, eq(campuses.id, clubsCampuses.campusId))
        // Joins for interest filtering/visibility (aggregation not required for EventEntity)
        .leftJoin(clubAreasOfInterest, eq(clubAreasOfInterest.clubId, clubs.id))
        .leftJoin(
          areasOfInterest,
          eq(areasOfInterest.id, clubAreasOfInterest.interestId)
        )
        .where(and(...filters))
        .groupBy(events.id, instagramPosts.clubId)
        .orderBy(events.startDatetime, events.id)
        .limit(limit)
        .offset(offset);

      const eventEntityArr: EventEntity[] = rows.map((r) => {
        const { campuses: campusesAgg, ...rest } = r;
        const campusesArr = campusesAgg ? campusesAgg.split(",") : [];
        return {
          ...rest,
          campuses: campusesArr,
        };
      });

      return eventEntityArr;
    } catch (error) {
      return new Error(`Something went wrong fetching Events: ${error}`);
    }
  }

  async countEvents(reqFilters: EventsFilters): Promise<number> {
    const filters = this.createFilters(reqFilters);

    const [{ total }] = await this.db
      .select({
        // DISTINCT to avoid accidental dupes if you ever add extra joins later
        total: sql<number>`COUNT(DISTINCT ${events.id})`,
      })
      .from(events)
      .innerJoin(instagramPosts, eq(instagramPosts.id, events.postId))
      .innerJoin(clubs, eq(clubs.id, instagramPosts.clubId))
      .where(and(...filters));

    return Number(total);
  }

  /**
   * Fetch events tied to a specific Instagram post.
   */
  async findByPostId(postId: string): Promise<EventRecord[]> {
    return await this.db.select().from(events).where(eq(events.postId, postId));
  }

  /**
   * Bulk-insert multiple events.
   * Skips any records that conflict on the primary key (id).
   */
  async saveMany(records: NewEvent[]): Promise<void> {
    if (records.length === 0) return;
    await this.db
      .insert(events)
      .values(records)
      .onConflictDoNothing({ target: events.id });
  }

  /**
   * Partially update an event by its ID.
   * You can pass any subset of fields (except for `postId` if you want to keep it immutable).
   * in case we build an admin page that should be able to edit events
   */
  async updateById(
    id: string,
    changes: Partial<Omit<NewEvent, "postId">>
  ): Promise<void> {
    await this.db.update(events).set(changes).where(eq(events.id, id));
  }

  /**
   * Delete an event by its ID.
   * in case we build an admin page that should be able to delete events
   */
  async deleteById(id: string): Promise<void> {
    await this.db.delete(events).where(eq(events.id, id));
  }

  private createFilters(f: EventsFilters) {
    const filters: SQL[] = [];

    // Date range: half-open [rangeStart, rangeEnd)
    if (f.rangeStart) {
      filters.push(gte(events.startDatetime, f.rangeStart));
    }
    if (f.rangeEnd) {
      filters.push(lte(events.startDatetime, f.rangeEnd));
    }

    // Campus filter (filter by campus KEYs via EXISTS against the owning club)
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

    // Interest filter (filter by interest KEYs via EXISTS against the owning club)
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

    // Text search across event, post caption, and club name
    if (f.searchFilter && f.searchFilter.trim().length > 0) {
      const q = `%${f.searchFilter.trim()}%`;
      const searchFilter = or(
        ilike(events.title, q),
        ilike(events.description, q),
        ilike(instagramPosts.caption, q),
        ilike(clubs.name, q)
      );
      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    return filters;
  }
}
