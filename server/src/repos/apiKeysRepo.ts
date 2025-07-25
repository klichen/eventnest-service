// src/repositories/ApiKeysRepo.ts
import { Postgres, type PgConnection } from "../db";
import { apiKeys, type ApiKeysRecord } from "../db/schema";
import { eq } from "drizzle-orm";

export class ApiKeysRepo {
  private db: PgConnection;

  constructor() {
    // TODO inject Postgres in tests
    const pg = new Postgres();
    this.db = pg.connection;
  }

  /* ------------------------------------------------------------------ *
   * Create a new key row (returns the whole record for logging)        *
   * ------------------------------------------------------------------ */
  async create(consumerName: string, prefix: string, hash: string) {
    try {
      await this.db
        .insert(apiKeys)
        .values({ consumerName, prefix, hash })
        .returning();
    } catch (err) {
      return new Error(`Something went wrong saving the api key: ${err}`);
    }
  }

  /* ------------------------------------------------------------------ *
   * Look-ups                                                           *
   * ------------------------------------------------------------------ */
  async findById(id: string): Promise<ApiKeysRecord | undefined | Error> {
    try {
      const [row] = await this.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, id));
      return row;
    } catch (err) {
      return new Error(`Something went wrong finding api key by id: ${err}`);
    }
  }

  /** Returns **all** rows that share the prefix (handles rare collisions). */
  async findByPrefix(prefix: string): Promise<ApiKeysRecord[] | Error> {
    try {
      return await this.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.prefix, prefix));
    } catch (err) {
      return new Error(
        `Something went wrong finding api keys by prefix: ${err}`
      );
    }
  }

  /* ------------------------------------------------------------------ *
   * Mutations                                                          *
   * ------------------------------------------------------------------ */
  /** Soft-revoke: set revoked_at timestamp. */
  async revoke(id: string, at = new Date()): Promise<void> {
    await this.db
      .update(apiKeys)
      .set({ revokedAt: at })
      .where(eq(apiKeys.id, id));
  }
}
