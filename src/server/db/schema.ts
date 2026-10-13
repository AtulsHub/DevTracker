/**
 * src/server/db/schema.ts
 * Full Drizzle ORM schema for DevTrack.
 * See docs/SPEC.md section 8 for the data model specification.
 *
 * Conventions:
 * - UUID primary keys (cuid2-style via gen_random_uuid())
 * - created_at / updated_at on every table
 * - Timestamps stored as timestamptz (UTC)
 */
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  unique,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────
export const profileVisibilityEnum = pgEnum("profile_visibility", [
  "PUBLIC",
  "FOLLOWERS_ONLY",
  "PRIVATE",
]);

export const audienceEnum = pgEnum("audience", [
  "EVERYONE",
  "FOLLOWERS",
  "TEAM",
  "ME",
]);

export const followStatusEnum = pgEnum("follow_status", [
  "PENDING",
  "ACCEPTED",
  "BLOCKED",
]);

export const platformEnum = pgEnum("platform", [
  "codeforces",
  "leetcode",
  "atcoder",
  "codechef",
  "hackerrank",
  "hackerearth",
  "cses",
  "kattis",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "pending",
  "running",
  "success",
  "degraded",
  "error",
]);

export const verdictEnum = pgEnum("verdict", [
  "OK",
  "WRONG_ANSWER",
  "TIME_LIMIT_EXCEEDED",
  "MEMORY_LIMIT_EXCEEDED",
  "RUNTIME_ERROR",
  "COMPILATION_ERROR",
  "PARTIAL",
  "OTHER",
]);

export const contestPhaseEnum = pgEnum("contest_phase", [
  "BEFORE",
  "CODING",
  "PENDING_SYSTEM_TEST",
  "SYSTEM_TEST",
  "FINISHED",
]);

export const teamVisibilityEnum = pgEnum("team_visibility", [
  "PUBLIC",
  "PRIVATE",
  "SECRET",
]);

export const teamRoleEnum = pgEnum("team_role", [
  "OWNER",
  "ADMIN",
  "MODERATOR",
  "MEMBER",
]);

export const teamMemberStatusEnum = pgEnum("team_member_status", [
  "ACTIVE",
  "PENDING",
  "INVITED",
]);

export const targetTypeEnum = pgEnum("target_type", [
  "SOLVE_COUNT",
  "SPECIFIC_PROBLEMS",
  "CONTEST_PARTICIPATION",
  "RATING_GOAL",
  "STREAK",
  "CUSTOM_CHECKLIST",
]);

export const recurrenceEnum = pgEnum("recurrence", [
  "none",
  "daily",
  "weekly",
]);

export const targetStatusEnum = pgEnum("target_status", [
  "active",
  "completed",
  "expired",
]);

export const contestRegistrationStatusEnum = pgEnum(
  "contest_registration_status",
  ["PLANNING", "REGISTERED", "DONE"]
);

export const upsolveStatusEnum = pgEnum("upsolve_status", [
  "pending",
  "solved",
  "skipped",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Identity tables
// ─────────────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  passwordHash: text("password_hash"), // null for OAuth-only users
  username: varchar("username", { length: 40 }).notNull().unique(),
  displayName: varchar("display_name", { length: 80 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  /** Short tagline shown under the name on public profiles */
  headline: varchar("headline", { length: 160 }),
  location: varchar("location", { length: 120 }),
  /** Optional age shown on public profile when set */
  age: integer("age"),
  websiteUrl: text("website_url"),
  githubUrl: text("github_url"),
  college: varchar("college", { length: 120 }),
  /** Comma-separated skills / topics (e.g. "DP, Graphs, System Design") */
  skills: text("skills"),
  timezone: varchar("timezone", { length: 60 }).notNull().default("UTC"),
  profileVisibility: profileVisibilityEnum("profile_visibility")
    .notNull()
    .default("PUBLIC"),
  discoverable: boolean("discoverable").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Auth.js required tables */
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [unique().on(table.provider, table.providerAccountId)]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [unique().on(table.identifier, table.token)]
);

/** Per-field privacy overrides */
export const privacySettings = pgTable(
  "privacy_settings",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    field: varchar("field", { length: 60 }).notNull(), // e.g. 'activity_feed', 'ratings'
    audience: audienceEnum("audience").notNull().default("EVERYONE"),
  },
  (table) => [unique().on(table.userId, table.field)]
);

export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followeeId: text("followee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: followStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.followerId, table.followeeId)]
);

// ─────────────────────────────────────────────────────────────────────────────
// Platform data tables
// ─────────────────────────────────────────────────────────────────────────────

export const platformAccounts = pgTable("platform_accounts", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  handle: varchar("handle", { length: 100 }).notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verificationToken: text("verification_token"),
  currentRating: integer("current_rating"),
  maxRating: integer("max_rating"),
  rank: varchar("rank", { length: 50 }),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  syncStatus: syncStatusEnum("sync_status").notNull().default("pending"),
  syncError: text("sync_error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
},
  // One row per (platform, handle). Required by the `onConflictDoUpdate`
  // target in `initiateAccountLink()` and to prevent duplicate claims.
  (table) => [unique().on(table.platform, table.handle)]
);

export const problems = pgTable(
  "problems",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    platform: platformEnum("platform").notNull(),
    externalId: varchar("external_id", { length: 100 }).notNull(),
    title: text("title").notNull(),
    url: text("url"),
    difficultyLabel: varchar("difficulty_label", { length: 30 }), // e.g. 'Easy', 'Medium', 'Hard'
    rating: integer("rating"), // numeric rating (CF uses 800-3500)
    tags: text("tags").array(), // topic tags
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.platform, table.externalId)]
);

export const submissions = pgTable(
  "submissions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    platformAccountId: text("platform_account_id")
      .notNull()
      .references(() => platformAccounts.id, { onDelete: "cascade" }),
    problemId: text("problem_id").references(() => problems.id),
    externalSubmissionId: varchar("external_submission_id", {
      length: 100,
    }).notNull(),
    verdict: verdictEnum("verdict").notNull(),
    language: varchar("language", { length: 50 }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
    isContest: boolean("is_contest").notNull().default(false),
    contestId: text("contest_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.platformAccountId, table.externalSubmissionId),
    index("submissions_account_time_idx").on(
      table.platformAccountId,
      table.submittedAt
    ),
  ]
);

/** Derived "first solve" table — one row per (user, problem). Powers counts and target checks. */
export const solves = pgTable(
  "solves",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id),
    firstSolvedAt: timestamp("first_solved_at", { withTimezone: true }).notNull(),
    solvedInContest: boolean("solved_in_contest").notNull().default(false),
  },
  (table) => [unique().on(table.userId, table.problemId)]
);

export const contests = pgTable(
  "contests",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    platform: platformEnum("platform").notNull(),
    externalId: varchar("external_id", { length: 100 }).notNull(),
    name: text("name").notNull(),
    url: text("url"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    durationSeconds: integer("duration_seconds"),
    type: varchar("type", { length: 50 }), // e.g. 'ICPC', 'CF', 'IOI'
    phase: contestPhaseEnum("phase").notNull().default("BEFORE"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.platform, table.externalId),
    index("contests_starts_at_idx").on(table.startsAt),
  ]
);

export const contestResults = pgTable("contest_results", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  platformAccountId: text("platform_account_id")
    .notNull()
    .references(() => platformAccounts.id, { onDelete: "cascade" }),
  contestId: text("contest_id")
    .notNull()
    .references(() => contests.id),
  rank: integer("rank"),
  ratingBefore: integer("rating_before"),
  ratingAfter: integer("rating_after"),
  solvedCount: integer("solved_count"),
  participatedAt: timestamp("participated_at", { withTimezone: true }),
});

/** Rollup table powering heatmaps and streaks. Rebuilt by worker after each sync. */
export const dailyActivity = pgTable(
  "daily_activity",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // 'YYYY-MM-DD' in user's timezone
    solvedCount: integer("solved_count").notNull().default(0),
    submissionsCount: integer("submissions_count").notNull().default(0),
    contestsCount: integer("contests_count").notNull().default(0),
    points: integer("points").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.userId, table.date),
    index("daily_activity_user_date_idx").on(table.userId, table.date),
  ]
);

export const syncRuns = pgTable("sync_runs", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  platformAccountId: text("platform_account_id")
    .notNull()
    .references(() => platformAccounts.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: syncStatusEnum("status").notNull().default("running"),
  itemsFetched: integer("items_fetched"),
  error: text("error"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Teams tables
// ─────────────────────────────────────────────────────────────────────────────

export const teams = pgTable("teams", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  description: text("description"),
  visibility: teamVisibilityEnum("visibility").notNull().default("PUBLIC"),
  memberVisibilityPolicy: audienceEnum("member_visibility_policy")
    .notNull()
    .default("TEAM"),
  avatarUrl: text("avatar_url"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  inviteCode: varchar("invite_code", { length: 32 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: teamRoleEnum("role").notNull().default("MEMBER"),
    status: teamMemberStatusEnum("status").notNull().default("ACTIVE"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.teamId, table.userId)]
);

export const teamAnnouncements = pgTable("team_announcements", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Targets tables
// ─────────────────────────────────────────────────────────────────────────────

export const targets = pgTable("targets", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }), // null = personal
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  type: targetTypeEnum("type").notNull(),
  criteria: jsonb("criteria").$type<Record<string, unknown>>().notNull(), // type-specific JSON object
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  recurrence: recurrenceEnum("recurrence").notNull().default("none"),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const targetAssignees = pgTable(
  "target_assignees",
  {
    targetId: text("target_id")
      .notNull()
      .references(() => targets.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [unique().on(table.targetId, table.userId)]
);

export const targetProgress = pgTable(
  "target_progress",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    targetId: text("target_id")
      .notNull()
      .references(() => targets.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currentValue: integer("current_value").notNull().default(0),
    goalValue: integer("goal_value").notNull(),
    status: targetStatusEnum("status").notNull().default("active"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.targetId, table.userId)]
);

// ─────────────────────────────────────────────────────────────────────────────
// Problem sets / curated lists
// ─────────────────────────────────────────────────────────────────────────────

export const problemSets = pgTable("problem_sets", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const problemSetItems = pgTable(
  "problem_set_items",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    problemSetId: text("problem_set_id")
      .notNull()
      .references(() => problemSets.id, { onDelete: "cascade" }),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (table) => [unique().on(table.problemSetId, table.problemId)]
);

// ─────────────────────────────────────────────────────────────────────────────
// Engagement tables
// ─────────────────────────────────────────────────────────────────────────────

export const contestRegistrations = pgTable(
  "contest_registrations",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contestId: text("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    status: contestRegistrationStatusEnum("status").notNull().default("PLANNING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.userId, table.contestId)]
);

export const upsolveItems = pgTable("upsolve_items", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  problemId: text("problem_id")
    .notNull()
    .references(() => problems.id),
  sourceContestId: text("source_contest_id").references(() => contests.id),
  status: upsolveStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 60 }).notNull(),
  payload: jsonb("payload"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const badges = pgTable("badges", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
});

export const userBadges = pgTable(
  "user_badges",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.userId, table.badgeId)]
);

export const auditLog = pgTable("audit_log", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  actorId: text("actor_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 60 }).notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Relations (for Drizzle query builder)
// ─────────────────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  platformAccounts: many(platformAccounts),
  follows: many(follows, { relationName: "follower" }),
  followers: many(follows, { relationName: "followee" }),
  privacySettings: many(privacySettings),
  solves: many(solves),
  teamMemberships: many(teamMembers),
  dailyActivity: many(dailyActivity),
  notifications: many(notifications),
}));

export const platformAccountsRelations = relations(
  platformAccounts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [platformAccounts.userId],
      references: [users.id],
    }),
    submissions: many(submissions),
    contestResults: many(contestResults),
    syncRuns: many(syncRuns),
  })
);

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, { fields: [teams.ownerId], references: [users.id] }),
  members: many(teamMembers),
  targets: many(targets),
  announcements: many(teamAnnouncements),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));
