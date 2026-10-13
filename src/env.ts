/**
 * env.ts – Single source of truth for validated environment variables.
 * The app fails fast at boot if any required variable is missing or malformed.
 * Import from here everywhere; never access process.env directly.
 */
import { z } from "zod";

const envSchema = z.object({
  // ── Database ────────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  DATABASE_URL_UNPOOLED: z
    .string()
    .url("DATABASE_URL_UNPOOLED must be a valid URL")
    .optional(),

  // ── Auth ────────────────────────────────────────────────────────────────────
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 chars"),
  AUTH_URL: z.string().url().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // ── Email ───────────────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // ── Web Push ────────────────────────────────────────────────────────────────
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),

  // ── Contest Aggregator ──────────────────────────────────────────────────────
  CLIST_API_KEY: z.string().optional(),
  CLIST_USERNAME: z.string().optional(),

  // ── Security ────────────────────────────────────────────────────────────────
  CRON_SECRET: z.string().optional(),

  // ── Observability ───────────────────────────────────────────────────────────
  SENTRY_DSN: z.string().optional(),

  // ── App ─────────────────────────────────────────────────────────────────────
  APP_URL: z.string().url().default("http://localhost:3000"),
  SYNC_USER_AGENT: z
    .string()
    .default("DevTrack/1.0 (+https://github.com/devtrack)"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌  Invalid environment variables:\n",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables. Check .env.example.");
  }
  return parsed.data;
}

// Cache validated env so we don't re-validate on every import.
let _env: Env | undefined;

function getEnv(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

export const env = getEnv();
export type { Env };
