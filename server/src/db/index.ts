import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
import {
  drizzle,
  NodePgDatabase,
  type NodePgClient,
} from "drizzle-orm/node-postgres";

export type PgConnection = NodePgDatabase<Record<string, unknown>> & {
  $client: NodePgClient;
};

// This class holds an instance of a connection pool and exposes the Drizzle connection.
export class Postgres {
  public connection: ReturnType<typeof drizzle>;

  constructor() {
    const { Pool } = pg;
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable not set");
    }
    // Create a new connection pool using the provided URL.
    const pool = new Pool({
      connectionString: url,
    });
    // Initialize Drizzle with the pool.
    this.connection = drizzle(pool);
  }

  // Call this when you want to close the pool gracefully.
  async close() {
    await (this.connection.$client as unknown as pg.Pool).end();
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
