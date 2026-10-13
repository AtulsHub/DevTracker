CREATE TYPE "public"."audience" AS ENUM('EVERYONE', 'FOLLOWERS', 'TEAM', 'ME');--> statement-breakpoint
CREATE TYPE "public"."contest_phase" AS ENUM('BEFORE', 'CODING', 'PENDING_SYSTEM_TEST', 'SYSTEM_TEST', 'FINISHED');--> statement-breakpoint
CREATE TYPE "public"."contest_registration_status" AS ENUM('PLANNING', 'REGISTERED', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."follow_status" AS ENUM('PENDING', 'ACCEPTED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('codeforces', 'leetcode', 'atcoder', 'codechef', 'hackerrank', 'hackerearth', 'cses', 'kattis');--> statement-breakpoint
CREATE TYPE "public"."profile_visibility" AS ENUM('PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."recurrence" AS ENUM('none', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'running', 'success', 'degraded', 'error');--> statement-breakpoint
CREATE TYPE "public"."target_status" AS ENUM('active', 'completed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."target_type" AS ENUM('SOLVE_COUNT', 'SPECIFIC_PROBLEMS', 'CONTEST_PARTICIPATION', 'RATING_GOAL', 'STREAK', 'CUSTOM_CHECKLIST');--> statement-breakpoint
CREATE TYPE "public"."team_member_status" AS ENUM('ACTIVE', 'PENDING', 'INVITED');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."team_visibility" AS ENUM('PUBLIC', 'PRIVATE', 'SECRET');--> statement-breakpoint
CREATE TYPE "public"."upsolve_status" AS ENUM('pending', 'solved', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('OK', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR', 'PARTIAL', 'OTHER');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_unique" UNIQUE("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"action" varchar(100) NOT NULL,
	"entity" varchar(60) NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(60) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon_url" text,
	CONSTRAINT "badges_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "contest_registrations" (
	"user_id" text NOT NULL,
	"contest_id" text NOT NULL,
	"status" "contest_registration_status" DEFAULT 'PLANNING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contest_registrations_user_id_contest_id_unique" UNIQUE("user_id","contest_id")
);
--> statement-breakpoint
CREATE TABLE "contest_results" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_account_id" text NOT NULL,
	"contest_id" text NOT NULL,
	"rank" integer,
	"rating_before" integer,
	"rating_after" integer,
	"solved_count" integer,
	"participated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contests" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "platform" NOT NULL,
	"external_id" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_seconds" integer,
	"type" varchar(50),
	"phase" "contest_phase" DEFAULT 'BEFORE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contests_platform_external_id_unique" UNIQUE("platform","external_id")
);
--> statement-breakpoint
CREATE TABLE "daily_activity" (
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"solved_count" integer DEFAULT 0 NOT NULL,
	"submissions_count" integer DEFAULT 0 NOT NULL,
	"contests_count" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_activity_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" text NOT NULL,
	"followee_id" text NOT NULL,
	"status" "follow_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_id_followee_id_unique" UNIQUE("follower_id","followee_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar(60) NOT NULL,
	"payload" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_accounts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"platform" "platform" NOT NULL,
	"handle" varchar(100) NOT NULL,
	"verified_at" timestamp with time zone,
	"verification_token" text,
	"current_rating" integer,
	"max_rating" integer,
	"rank" varchar(50),
	"last_synced_at" timestamp with time zone,
	"sync_status" "sync_status" DEFAULT 'pending' NOT NULL,
	"sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_accounts_platform_handle_unique" UNIQUE("platform","handle")
);
--> statement-breakpoint
CREATE TABLE "privacy_settings" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"field" varchar(60) NOT NULL,
	"audience" "audience" DEFAULT 'EVERYONE' NOT NULL,
	CONSTRAINT "privacy_settings_user_id_field_unique" UNIQUE("user_id","field")
);
--> statement-breakpoint
CREATE TABLE "problem_set_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_set_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "problem_set_items_problem_set_id_problem_id_unique" UNIQUE("problem_set_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "problem_sets" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" text,
	"created_by" text NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "platform" NOT NULL,
	"external_id" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"difficulty_label" varchar(30),
	"rating" integer,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "problems_platform_external_id_unique" UNIQUE("platform","external_id")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"first_solved_at" timestamp with time zone NOT NULL,
	"solved_in_contest" boolean DEFAULT false NOT NULL,
	CONSTRAINT "solves_user_id_problem_id_unique" UNIQUE("user_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_account_id" text NOT NULL,
	"problem_id" text,
	"external_submission_id" varchar(100) NOT NULL,
	"verdict" "verdict" NOT NULL,
	"language" varchar(50),
	"submitted_at" timestamp with time zone NOT NULL,
	"is_contest" boolean DEFAULT false NOT NULL,
	"contest_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_platform_account_id_external_submission_id_unique" UNIQUE("platform_account_id","external_submission_id")
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_account_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "sync_status" DEFAULT 'running' NOT NULL,
	"items_fetched" integer,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "target_assignees" (
	"target_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "target_assignees_target_id_user_id_unique" UNIQUE("target_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "target_progress" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_id" text NOT NULL,
	"user_id" text NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"goal_value" integer NOT NULL,
	"status" "target_status" DEFAULT 'active' NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "target_progress_target_id_user_id_unique" UNIQUE("target_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "targets" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" text,
	"created_by" text NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"type" "target_type" NOT NULL,
	"criteria" jsonb NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"recurrence" "recurrence" DEFAULT 'none' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_announcements" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" text NOT NULL,
	"author_id" text NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "team_role" DEFAULT 'MEMBER' NOT NULL,
	"status" "team_member_status" DEFAULT 'ACTIVE' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_team_id_user_id_unique" UNIQUE("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(60) NOT NULL,
	"description" text,
	"visibility" "team_visibility" DEFAULT 'PUBLIC' NOT NULL,
	"member_visibility_policy" "audience" DEFAULT 'TEAM' NOT NULL,
	"avatar_url" text,
	"owner_id" text NOT NULL,
	"invite_code" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug"),
	CONSTRAINT "teams_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "upsolve_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"source_contest_id" text,
	"status" "upsolve_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"user_id" text NOT NULL,
	"badge_id" text NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_badges_user_id_badge_id_unique" UNIQUE("user_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp with time zone,
	"password_hash" text,
	"username" varchar(40) NOT NULL,
	"display_name" varchar(80),
	"avatar_url" text,
	"bio" text,
	"timezone" varchar(60) DEFAULT 'UTC' NOT NULL,
	"profile_visibility" "profile_visibility" DEFAULT 'PUBLIC' NOT NULL,
	"discoverable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_unique" UNIQUE("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_registrations" ADD CONSTRAINT "contest_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_registrations" ADD CONSTRAINT "contest_registrations_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_results" ADD CONSTRAINT "contest_results_platform_account_id_platform_accounts_id_fk" FOREIGN KEY ("platform_account_id") REFERENCES "public"."platform_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_results" ADD CONSTRAINT "contest_results_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_followee_id_users_id_fk" FOREIGN KEY ("followee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_accounts" ADD CONSTRAINT "platform_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_settings" ADD CONSTRAINT "privacy_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_set_items" ADD CONSTRAINT "problem_set_items_problem_set_id_problem_sets_id_fk" FOREIGN KEY ("problem_set_id") REFERENCES "public"."problem_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_set_items" ADD CONSTRAINT "problem_set_items_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_sets" ADD CONSTRAINT "problem_sets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_sets" ADD CONSTRAINT "problem_sets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves" ADD CONSTRAINT "solves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves" ADD CONSTRAINT "solves_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_platform_account_id_platform_accounts_id_fk" FOREIGN KEY ("platform_account_id") REFERENCES "public"."platform_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_platform_account_id_platform_accounts_id_fk" FOREIGN KEY ("platform_account_id") REFERENCES "public"."platform_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_assignees" ADD CONSTRAINT "target_assignees_target_id_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_assignees" ADD CONSTRAINT "target_assignees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_progress" ADD CONSTRAINT "target_progress_target_id_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_progress" ADD CONSTRAINT "target_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targets" ADD CONSTRAINT "targets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targets" ADD CONSTRAINT "targets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_announcements" ADD CONSTRAINT "team_announcements_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_announcements" ADD CONSTRAINT "team_announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upsolve_items" ADD CONSTRAINT "upsolve_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upsolve_items" ADD CONSTRAINT "upsolve_items_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upsolve_items" ADD CONSTRAINT "upsolve_items_source_contest_id_contests_id_fk" FOREIGN KEY ("source_contest_id") REFERENCES "public"."contests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contests_starts_at_idx" ON "contests" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "daily_activity_user_date_idx" ON "daily_activity" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "submissions_account_time_idx" ON "submissions" USING btree ("platform_account_id","submitted_at");