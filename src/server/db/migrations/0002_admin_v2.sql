ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "suspended_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "app_settings" (
  "key" varchar(80) PRIMARY KEY,
  "value" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
