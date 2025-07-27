// src/repos/EventsRepo.ts

import { Postgres, type PgConnection } from "../../db";
import { events } from "../../db/schema";
import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";

export type EventRecord = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;

export class EventsRepo {
  private db: PgConnection;

  // TODO DI for postgres connection
  constructor() {
    const pg = new Postgres();
    this.db = pg.connection;
  }

  /**
   * Fetch *all* events.
   */
  async getAllEvents(): Promise<EventRecord[]> {
    return await this.db.select().from(events);
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
   * Insert a single new event.
   */
  async save(record: NewEvent): Promise<void> {
    await this.db.insert(events).values(record);
  }

  /**
   * Partially update an event by its ID.
   * You can pass any subset of fields (except for `postId` if you want to keep it immutable).
   */
  async updateById(
    id: string,
    changes: Partial<Omit<NewEvent, "postId">>
  ): Promise<void> {
    await this.db.update(events).set(changes).where(eq(events.id, id));
  }

  /**
   * Delete an event by its ID.
   */
  async deleteById(id: string): Promise<void> {
    await this.db.delete(events).where(eq(events.id, id));
  }
}
