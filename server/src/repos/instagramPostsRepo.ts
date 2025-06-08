import { Postgres, type PgConnection } from "../db";
import { instagramPosts, postStatusEnum } from "../db/schema";
import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { z } from "zod";

const instagramPostStatusSchema = z.enum(postStatusEnum.enumValues);
export type PostStatus = z.infer<typeof instagramPostStatusSchema>;

// “Select” gives you the full row as it comes out of SELECT queries:
export type InstagramPostRecord = InferSelectModel<typeof instagramPosts>;

// “Insert” gives you exactly what you need to pass to .insert(...):
export type NewInstagramPost = InferInsertModel<typeof instagramPosts>;

export class InstagramPostRepo {
  private db: PgConnection;

  constructor() {
    const pg = new Postgres();
    this.db = pg.connection;
  }

  /**
   * Bulk‐insert (or upsert) an array of InstagramPostRecord.
   * - If a postUrl already exists, skip inserting it.
   * - Otherwise, insert it with status = "unprocessed".
   */
  async saveMany(records: NewInstagramPost[]): Promise<void> {
    if (records.length === 0) return;

    // Use onConflictDoNothing on postUrl to avoid duplicates.
    await this.db.insert(instagramPosts).values(records).onConflictDoNothing({
      target: instagramPosts.postUrl,
    });
  }

  /**
   * Optionally fetch existing posts for a given club
   */
  async findByClubId(clubId: string) {
    return await this.db
      .select()
      .from(instagramPosts)
      .where(eq(instagramPosts.clubId, clubId));
  }

  /**
   * (Later) you might want to update status or delete old posts, etc.
   * Example: mark as "processing" or "processed" by post URL.
   */
  async updateStatusByPostUrl(
    postUrl: string,
    newStatus: InstagramPostRecord["status"]
  ) {
    await this.db
      .update(instagramPosts)
      .set({ status: newStatus })
      .where(eq(instagramPosts.postUrl, postUrl));
  }
}
