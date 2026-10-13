/**
 * src/server/db/auth-tables.ts
 *
 * Adapter-facing table definitions for Auth.js (NextAuth v5).
 *
 * `@auth/drizzle-adapter` expects tables whose *column property names* match
 * the Auth.js defaults (`name`, `emailVerified`, `image`, `refresh_token`, …).
 * Our app schema (`./schema.ts`) deliberately uses different property names
 * (`displayName`, `avatarUrl`, camelCase account tokens) and is used everywhere
 * else in the app.
 *
 * To avoid renaming columns across the whole codebase, we expose these
 * adapter-only table objects that read/write the *same physical tables and
 * columns* but present the property names the adapter requires.
 *
 * Keep the physical column names in sync with `./schema.ts`.
 */
import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Maps to the physical `users` table (see `schema.ts` → `users`). */
export const authUsers = pgTable("users", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("display_name", { length: 80 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("avatar_url"),
  // Required by physical schema; DB default + createUser event fills a real handle
  username: varchar("username", { length: 40 })
    .notNull()
    .default(sql`'u_' || substr(md5(random()::text), 1, 12)`),
});

/** Maps to the physical `accounts` table (see `schema.ts` → `accounts`). */
export const authAccounts = pgTable("accounts", {
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

/** Maps to the physical `sessions` table (see `schema.ts` → `sessions`). */
export const authSessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

/** Maps to the physical `verification_tokens` table (see `schema.ts`). */
export const authVerificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});
