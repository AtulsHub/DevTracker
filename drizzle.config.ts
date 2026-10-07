import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load .env.local for local development
dotenv.config({ path: ".env.local" });

const unpooled = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!unpooled) {
  throw new Error(
    "DATABASE_URL_UNPOOLED (or DATABASE_URL) must be set for migrations."
  );
}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: unpooled,
  },
  verbose: true,
  strict: true,
});
