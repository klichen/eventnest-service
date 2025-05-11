import { Postgres, type PgConnection } from "../db";
import { clubInstagramTokens } from "../db/schema";
import { eq, lt } from "drizzle-orm";

/** Shape of a row in club_instagram_tokens */
export interface ClubInstagramTokenRecord {
  clubId: string;
  instagramUsername: string;
  accessToken: string;
  expiration: Date;
}

export class InstagramTokenRepo {
  private db: PgConnection;
  constructor() {
    const pg = new Postgres();
    this.db = pg.connection;
  }
  /**
   * Insert or update a token record for a given club.
   * On conflict (same clubId), it updates all fields.
   */
  async save(record: ClubInstagramTokenRecord): Promise<void> {
    await this.db
      .insert(clubInstagramTokens)
      .values(record)
      .onConflictDoUpdate({
        target: clubInstagramTokens.clubId,
        set: {
          instagramUsername: record.instagramUsername,
          accessToken: record.accessToken,
          expiration: record.expiration,
        },
      });
  }

  /**
   * Fetch the token record for a single clubId.
   */
  async findByClubId(
    clubId: string
  ): Promise<ClubInstagramTokenRecord | undefined> {
    const [row] = await this.db
      .select()
      .from(clubInstagramTokens)
      .where(eq(clubInstagramTokens.clubId, clubId));
    return row;
  }

  /**
   * Fetch all token records that expire before the given cutoff date.
   */
  async findExpiring(cutoff: Date): Promise<ClubInstagramTokenRecord[]> {
    return await this.db
      .select()
      .from(clubInstagramTokens)
      .where(lt(clubInstagramTokens.expiration, cutoff));
  }

  /**
   * Delete a token record for a club.
   */
  async deleteByClubId(clubId: string): Promise<void> {
    await this.db
      .delete(clubInstagramTokens)
      .where(eq(clubInstagramTokens.clubId, clubId));
  }
}
