// src/repositories/ClubRepo.ts

import { Postgres, type PgConnection } from "../db";
import { clubs, clubAreasOfInterest, clubsCampuses } from "../db/schema";
import { eq } from "drizzle-orm";

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

export class ClubRepo {
  private db: PgConnection;

  constructor() {
    // TODO use dependency injection for db
    const pg = new Postgres();
    this.db = pg.connection;
  }

  /**
   * Fetch a club by its UUID.
   */
  async findById(id: string): Promise<ClubRecord | undefined> {
    const [row] = await this.db.select().from(clubs).where(eq(clubs.id, id));
    return row;
  }

  /**
   * Fetch a club by its externalId (id from SOP)
   */
  async findByExternalId(externalId: number): Promise<ClubRecord | undefined> {
    const [row] = await this.db
      .select()
      .from(clubs)
      .where(eq(clubs.externalId, externalId));
    return row;
  }

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
