import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

await sql.query(
  `ALTER TABLE users ALTER COLUMN username SET DEFAULT ('u_' || substr(md5(random()::text), 1, 12))`,
);
console.log("username default set");
