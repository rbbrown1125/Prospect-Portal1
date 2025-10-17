import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const DEFAULT_DATABASE_URL = "postgresql://postgres@127.0.0.1:5432/prospect_portal";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
  console.warn(
    "DATABASE_URL not provided. Falling back to bundled Postgres instance at postgresql://postgres@127.0.0.1:5432/prospect_portal",
  );
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export const db = drizzle({ client: pool, schema });