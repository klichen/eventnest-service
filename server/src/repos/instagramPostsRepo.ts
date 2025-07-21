import { Postgres, type PgConnection } from "../db";
import { instagramPosts, postStatusEnum } from "../db/schema";
import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { z } from "zod";

const instagramPostStatusSchema = z.enum(postStatusEnum.enumValues);
export type PostStatus = z.infer<typeof instagramPostStatusSchema>;

export type InstagramPostRecord = InferSelectModel<typeof instagramPosts>;
export type NewInstagramPost = InferInsertModel<typeof instagramPosts>;

export class InstagramPostRepo {
  private db: PgConnection;

  constructor() {
    const pg = new Postgres();
    this.db = pg.connection;
  }

  async getAllUnprocessedPosts() {
    return await this.db
      .select()
      .from(instagramPosts)
      .where(eq(instagramPosts.status, "unprocessed"));
  }

  /**
   * Bulk‐insert (or upsert) an array of NewInstagramPost.
   * - If a postUrl already exists, skip inserting it.
   * - Otherwise, insert it with status = "unprocessed".
   */
  async saveMany(records: NewInstagramPost[]): Promise<void> {
    if (records.length === 0) return;

    await this.db.insert(instagramPosts).values(records);
  }

  /**
   * Fetch existing posts for a given club
   */
  async findByClubId(clubId: string) {
    return await this.db
      .select()
      .from(instagramPosts)
      .where(eq(instagramPosts.clubId, clubId));
  }

  /**
   * Update post status
   */
  async updateStatusByPostId(
    postId: string,
    newStatus: InstagramPostRecord["status"]
  ) {
    await this.db
      .update(instagramPosts)
      .set({ status: newStatus })
      .where(eq(instagramPosts.id, postId));
  }
}
