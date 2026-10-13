import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = neon(url);

const statements = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS headline varchar(160)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS location varchar(120)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS age integer`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS college varchar(120)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS skills text`,
];

for (const s of statements) {
  await sql.query(s);
  console.log("ok:", s);
}

console.log("done");
