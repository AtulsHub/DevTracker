# DevTrack – Step-by-Step Implementation Guide

> **Stack:** Next.js 16 · React 19 · TypeScript strict · Tailwind CSS v4 · Drizzle ORM · Neon Postgres · Auth.js v5 · Vercel · pnpm

---

## Quick Reference — What's Already Built

| File | Status | Description |
|------|--------|-------------|
| `src/env.ts` | ✅ Done | Zod-validated env vars — fail fast at boot |
| `src/server/db/schema.ts` | ✅ Done | Full Drizzle schema (all tables from spec §8) |
| `src/server/db/index.ts` | ✅ Done | Neon serverless DB client |
| `drizzle.config.ts` | ✅ Done | Migration config (direct URL) |
| `src/server/auth/index.ts` | ✅ Done | Auth.js v5: Credentials + GitHub + Google |
| `src/server/privacy/can-view.ts` | ✅ Done | 5-step visibility decision |
| `src/server/platforms/types.ts` | ✅ Done | Adapter interface + normalized types |
| `src/server/platforms/codeforces.ts` | ✅ Done | Codeforces adapter (P0) |
| `src/server/platforms/index.ts` | ✅ Done | Adapter registry |
| `src/app/api/health/route.ts` | ✅ Done | Health check with DB ping |
| `src/app/api/auth/register/route.ts` | ✅ Done | POST registration with bcrypt |
| `src/app/api/auth/[...nextauth]/route.ts` | ✅ Done | Auth.js handlers |
| `src/app/api/cron/sync-active-accounts/route.ts` | ✅ Done | Cron: 15-min account sync trigger |
| `src/middleware.ts` | ✅ Done | Auth protection for app routes |
| `src/app/layout.tsx` | ✅ Done | Root layout + fonts + SEO metadata |
| `src/app/globals.css` | ✅ Done | Design system CSS (dark theme, animations) |
| `src/app/page.tsx` | ✅ Done | Landing page |
| `src/app/(auth)/sign-in/page.tsx` | ✅ Done | Sign-in page |
| `src/app/(auth)/sign-up/page.tsx` | ✅ Done | Sign-up page |
| `src/app/(app)/layout.tsx` | ✅ Done | App shell (sidebar + bottom nav) |
| `src/app/(app)/dashboard/page.tsx` | ✅ Done | Dashboard stub |
| `src/lib/utils.ts` | ✅ Done | Shared utilities |
| `vercel.json` | ✅ Done | Vercel Cron Jobs config |
| `.github/workflows/ci.yml` | ✅ Done | CI: lint + typecheck + test + build |
| `tests/privacy.test.ts` | ✅ Done | Exhaustive privacy matrix tests |
| `.env.example` | ✅ Done | All env vars documented |

---

## Phase 0 — Foundation (Tasks 0.1–0.5)

### Task 0.1 — Scaffold DONE
The Next.js app is scaffolded. Run locally:

```bash
cp .env.example .env.local
# Fill in DATABASE_URL and AUTH_SECRET at minimum
pnpm dev
```

**Check:** Visit `http://localhost:3000` (landing page) and `http://localhost:3000/api/health`

---

### Task 0.2 — Database Migrations

**What to do:**
1. Create a free [Neon](https://console.neon.tech) project.
2. Copy the **Pooled connection string** → paste as `DATABASE_URL` in `.env.local`
3. Copy the **Direct connection string** → paste as `DATABASE_URL_UNPOOLED`
4. Generate and run the first migration:

```bash
pnpm db:generate    # generates SQL migration in src/server/db/migrations/
pnpm db:migrate     # applies migration to your Neon DB
```

5. Verify health:
```bash
curl http://localhost:3000/api/health
# Expected: {"ok":true,"db":"ok","latencyMs":...}
```

**Tip:** Use `pnpm db:studio` to open a visual browser of your Neon tables.

> IMPORTANT: The schema uses `gen_random_uuid()` which is built into Postgres 13+. Neon supports it natively.

---

### Task 0.3 — Auth Setup

**What to do:**
1. Create a GitHub OAuth App:
   - Go to https://github.com/settings/applications/new
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/callback/github`
   - Copy Client ID → `AUTH_GITHUB_ID`
   - Copy Client Secret → `AUTH_GITHUB_SECRET`

2. Create a Google OAuth App:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID → `AUTH_GOOGLE_ID`
   - Copy Client Secret → `AUTH_GOOGLE_SECRET`

3. Generate an Auth secret:
```bash
openssl rand -base64 32
# Paste result → AUTH_SECRET
```

4. Set `AUTH_URL=http://localhost:3000`

**Check:**
```bash
pnpm dev
# Visit http://localhost:3000/sign-up
# Create account, then sign in
# Visit http://localhost:3000/dashboard (should show dashboard, not redirect)
```

---

### Task 0.4 — GitHub Actions CI

**What to do:**
1. Push the repo to GitHub:
```bash
cd devtrack
git init
git add .
git commit -m "feat: initial scaffold"
git remote add origin https://github.com/YOUR_USERNAME/devtrack.git
git push -u origin main
```

2. Set up GitHub Actions secrets (Repository → Settings → Secrets → Actions):
   - `DATABASE_URL_CI` — create a separate Neon branch for CI
   - `AUTH_SECRET` — same value as your local `.env.local`

3. Create a PR or push to main — CI will run automatically.

> TIP: Create a separate Neon branch for CI: Neon Console → Branches → + Create branch. This isolates CI from your dev database.

---

## Phase 1 — Core Tracking (Tasks 1.1–1.5)

### Task 1.1 — Codeforces Adapter (DONE, needs tests)

Create fixture files for offline testing:

```bash
curl "https://codeforces.com/api/user.info?handles=tourist" > tests/fixtures/codeforces/user.info.json
curl "https://codeforces.com/api/user.status?handle=tourist&from=1&count=5" > tests/fixtures/codeforces/user.status.json
curl "https://codeforces.com/api/user.rating?handle=tourist" > tests/fixtures/codeforces/user.rating.json
```

Then write contract tests in `tests/codeforces.test.ts`.

**Run tests:**
```bash
pnpm test
```

---

### Task 1.2 — Account Linking Flow

**Files to create:**
- `src/app/(app)/settings/page.tsx` — Settings page with "Link Platform" section
- `src/app/api/platforms/[platform]/link/route.ts` — POST: generate verification token
- `src/app/api/platforms/[platform]/verify/route.ts` — POST: call adapter.verifyOwnership()
- `src/server/services/platforms.ts` — Business logic for linking

**Steps:**
1. User enters their Codeforces handle
2. API creates `platform_accounts` record with `sync_status: 'pending'` and returns a `verification_token`
3. UI shows verification instructions (submit a failing solution to CF problem 4A)
4. User clicks "I've done it" → POST to `/verify`
5. API calls `codeforcesAdapter.verifyOwnership(handle, token)`
6. On success: update `verified_at`, trigger initial backfill job

---

### Task 1.3 — Sync Service

**Files to create:**
- `src/server/services/sync.ts` — `syncAccount(platformAccountId)` function
- `src/app/api/platforms/[platform]/[id]/sync/route.ts` — Manual refresh

**What `syncAccount` does:**
```typescript
async function syncAccount(platformAccountId: string) {
  // 1. Load platform account + user
  // 2. Call adapter.fetchSubmissions(handle, lastSyncedAt)
  // 3. Upsert problems (on conflict update)
  // 4. Upsert submissions (on conflict do nothing)
  // 5. Upsert solves (first accepted only)
  // 6. Call rollupDaily(userId, affectedDates)
  // 7. Update lastSyncedAt, syncStatus = 'success'
  // 8. Write to sync_runs table
}
```

---

### Task 1.4 — LeetCode Adapter

**File to create:** `src/server/platforms/leetcode.ts`

Key points:
- Endpoint: `https://leetcode.com/graphql`
- No official API — use GraphQL queries
- Verify ownership: token in profile summary
- On failure: set `syncStatus = 'degraded'` instead of throwing

```bash
# Save actual LC GraphQL response as fixture first
curl -X POST https://leetcode.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { matchedUser(username: \"lee215\") { username submitStats { acSubmissionNum { difficulty count } } } }"}' \
  > tests/fixtures/leetcode/matchedUser.json
```

> WARNING: LeetCode's unofficial API schema can change without notice. Always test against a saved fixture, not live in CI.

---

### Task 1.5 — Dashboard & Daily Activity

**Files to create/expand:**
- `src/components/features/Heatmap.tsx` — 365-day contribution heatmap
- `src/components/features/StreakCounter.tsx` — Animated streak counter
- `src/components/features/ActivityTimeline.tsx` — Per-day solve/contest list
- `src/app/(app)/activity/page.tsx` — Daily activity page with date strip
- `src/server/services/activity.ts` — `getDailyActivity(userId, date)` query

---

## Phase 2 — Contests (Task 2.1)

**Files to create:**
- `src/app/(app)/contests/page.tsx` — Contest list with filters + countdown
- `src/app/api/contests/route.ts` — GET contests by platform/date range
- `src/app/api/contests/ics/route.ts` — Generate .ics calendar file
- `src/app/api/cron/refresh-contests/route.ts` — Complete the cron stub

---

## Phase 3 — Social and Privacy (Tasks 3.1–3.2)

### Task 3.1 — Privacy Engine (DONE, tests exist)

Run the privacy test suite:
```bash
pnpm test tests/privacy.test.ts
```

### Task 3.2 — Follow System and Public Profile

**Files to create:**
- `src/app/u/[username]/page.tsx` — Public profile page
- `src/app/api/follow/[username]/route.ts` — POST to follow/unfollow
- `src/app/api/follow/requests/[id]/route.ts` — Accept/reject follow requests

> IMPORTANT: Every query returning another user's data MUST pass through `canView()`.
> ```typescript
> const canSeeActivity = await canView(session.user.id, owner.id, 'activity_feed');
> if (!canSeeActivity) return { activity: [] };
> ```

---

## Phase 4 — Teams (Tasks 4.1–4.3)

### Task 4.1 — Teams CRUD

**Files to create:**
- `src/app/(app)/teams/page.tsx` — Teams list page
- `src/app/(app)/teams/[slug]/page.tsx` — Team detail page
- `src/app/api/teams/route.ts` — POST: create team
- `src/app/api/teams/[slug]/route.ts` — GET team info
- `src/server/services/teams.ts` — Team business logic

### Task 4.2 — Leaderboard

Query pattern for team leaderboard (weekly):
```typescript
const leaderboard = await db
  .select({
    userId: dailyActivity.userId,
    totalSolved: sql`SUM(${dailyActivity.solvedCount})`,
  })
  .from(dailyActivity)
  .innerJoin(teamMembers, eq(teamMembers.userId, dailyActivity.userId))
  .where(
    and(
      eq(teamMembers.teamId, teamId),
      gte(dailyActivity.date, weekStartStr)
    )
  )
  .groupBy(dailyActivity.userId)
  .orderBy(desc(sql`SUM(${dailyActivity.solvedCount})`));
```

### Task 4.3 — Targets Engine

Target recalculation cron logic (hourly):
```typescript
// For SOLVE_COUNT targets:
// 1. Find all active targets with type = 'SOLVE_COUNT'
// 2. For each target, for each assignee:
//    - Count solves where submittedAt >= target.startsAt
//    - Apply criteria filters (platform, rating range, tags)
//    - Update target_progress.currentValue
//    - If currentValue >= goalValue: mark completed, send notification
```

---

## Phase 5 — Polish (Tasks 5.x)

### PWA Manifest

Create `public/manifest.json`:
```json
{
  "name": "DevTrack",
  "short_name": "DevTrack",
  "theme_color": "#0a0a0f",
  "background_color": "#0a0a0f",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/dashboard",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Command Palette (Ctrl+K)
```bash
pnpm add cmdk
```
Create `src/components/features/CommandPalette.tsx`.

---

## Phase 6 — Vercel Deployment

### One-time Vercel setup:
```bash
pnpm dlx vercel login
pnpm dlx vercel link
```

### Environment variables to set in Vercel Dashboard:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon pooled URL |
| `DATABASE_URL_UNPOOLED` | Neon direct URL |
| `AUTH_SECRET` | Your secret (32+ chars) |
| `AUTH_URL` | `https://yourdomain.vercel.app` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth app |
| `CRON_SECRET` | Random secret |
| `APP_URL` | `https://yourdomain.vercel.app` |

### Deploy:
```bash
git push origin main
# Vercel auto-deploys on push to main
```

### Run migrations on production:
```bash
DATABASE_URL_UNPOOLED="your-direct-url" pnpm db:migrate
```

---

## Cron Jobs (Vercel Cron)

| Cron path | Schedule | Purpose |
|-----------|----------|---------|
| `/api/cron/sync-active-accounts` | Every 15 min | Sync platform submissions |
| `/api/cron/refresh-contests` | Every 30 min | Fetch upcoming contests |
| `/api/cron/recalc-targets` | Every hour | Recalculate target progress |
| `/api/cron/contest-reminders` | Every 5 min | Send 1hr/10min reminders |
| `/api/cron/weekly-digest` | Monday 4am UTC | Email weekly report |
| `/api/cron/cleanup` | Daily 2am UTC | Purge old sync_runs |

All cron routes check `Authorization: Bearer {CRON_SECRET}` header.

---

## Useful Commands

```bash
# Development
pnpm dev              # Start dev server at localhost:3000
pnpm lint             # ESLint
pnpm typecheck        # TypeScript strict check
pnpm test             # Run all Vitest tests
pnpm test:watch       # Watch mode

# Database
pnpm db:generate      # Generate migration from schema changes
pnpm db:migrate       # Apply migrations to DB
pnpm db:studio        # Open Drizzle Studio (visual DB browser)

# Production
pnpm build            # Build for production
```

---

## Adding a New Platform Adapter

1. Add to `platformEnum` in `src/server/db/schema.ts`
2. `pnpm db:generate` to create a migration
3. Create `src/server/platforms/{platform}.ts` implementing `PlatformAdapter`
4. Register in `src/server/platforms/index.ts`
5. Add fixtures to `tests/fixtures/{platform}/`
6. Write contract tests in `tests/{platform}.test.ts`

---

## Security Checklist

- [ ] All user data queries go through `canView()` — never filter client-side
- [ ] All API inputs validated with Zod
- [ ] Rate limit auth endpoints
- [ ] Cron routes protected with `CRON_SECRET`
- [ ] Never store platform passwords or session cookies — only public data
- [ ] Use `sslmode=require` for all Neon connections
- [ ] Passwords hashed with bcrypt (12 rounds minimum)
- [ ] `AUTH_SECRET` is at least 32 chars

---

## Troubleshooting

**"Ignored build scripts: esbuild"**
```bash
pnpm install --ignore-scripts
echo '{}' | pnpm approve-builds --all
```

**"DATABASE_URL must be a valid URL"**
- Check `.env.local` exists and has correct `DATABASE_URL`
- Make sure `sslmode=require` is appended to the URL

**Auth.js session not persisting**
- `AUTH_SECRET` must be consistent across restarts
- Session table must exist in DB (run `pnpm db:migrate`)

**LeetCode sync failing**
- Expected — LeetCode's API is unofficial and may block requests
- Set `syncStatus = 'degraded'` and show "Last synced X ago" in UI
