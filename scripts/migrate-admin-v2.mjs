import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = neon(url);
await sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS suspended_at timestamptz`;
await sql`
  CREATE TABLE IF NOT EXISTS app_settings (
    key varchar(80) PRIMARY KEY,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
  )
`;
console.log("admin v2 schema ready");
