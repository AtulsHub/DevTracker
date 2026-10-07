/**
 * src/server/db/index.ts
 * Neon Postgres connection using the serverless driver.
 * Uses the pooled URL for web requests and direct URL for migrations/workers.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/env";
import * as schema from "./schema";

// Create a Neon HTTP client (edge-compatible, serverless-safe)
const sql = neon(env.DATABASE_URL);

/** The main Drizzle database instance. Use this for all queries in the web app. */
export const db = drizzle(sql, { schema });

export type DB = typeof db;
