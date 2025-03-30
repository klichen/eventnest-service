import type { NeonQueryFunction } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";

export type NeonConnection = NeonHttpDatabase<Record<string, unknown>> & {
  $client: NeonQueryFunction<any, any>;
};

export class Postgres {
  // Holds the singleton connection instance
  private static _connection: ReturnType<typeof drizzle> | null = null;

  // Getter for the connection. Initializes it if it hasn't been created.
  public static get connection() {
    if (!this._connection) {
      const url = process.env.DATABASE_URL;
      if (!url) {
        throw new Error("POSTGRES_URL environment variable not set");
      }
      // Initialize the connection using drizzle.
      this._connection = drizzle(url);
    }
    return this._connection;
  }
}

/**
USAGE 

import { Postgres } from './Postgres';

class ClubRepository {
  private db = Postgres.connection;

  async getClubs() {
    // Use this.db to run your queries.
    return await this.db.query('SELECT * FROM clubs');
  }
}
 */
