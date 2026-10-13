# DevTrack: Product & Engineering Specification

*Working name. An all-in-one platform for teams of developers to track competitive programming and DSA progress, plan contests, and set shared targets.*

**Stack:** Next.js (App Router, TypeScript), Neon Postgres, Docker, GitHub Actions CI/CD.

Quick start for Cursor: save this doc as docs/SPEC.md in an empty repo, follow the setup in section 21.1, paste the kickoff prompt from section 20, then run the tasks in section 21.6 one per chat.

---

## 1. Vision and goals

DevTrack is one dashboard where a developer links all their coding-platform accounts (Codeforces, LeetCode, AtCoder, CodeChef and more) and sees everything they solved and every contest they played, per day, in one place. Teams (college clubs, placement groups, friends, company cohorts) get shared dashboards, leaderboards and admin-set targets.

**Goals**

- Single source of truth for daily DSA activity across platforms.
- Social accountability: follow system, teams, streaks, leaderboards.
- Forward planning: upcoming contests calendar, targets, reminders.
- Privacy by default: members control exactly who can see what.
- Feels like a native app on phones (PWA, bottom nav) and a power tool on desktop.

**Non-goals (v1):** hosting a code judge, running contests ourselves, in-browser code editor.

**Priority platforms:** Codeforces (P0), LeetCode (P0), AtCoder (P1), CodeChef (P1), later GeeksforGeeks, HackerRank, HackerEarth, CSES, Kattis.

---

## 2. Users and roles

| Role | Scope | Capabilities |
| --- | --- | --- |
| Visitor | Not logged in | Landing page, public profiles, public contest calendar |
| Member | Platform user | Link accounts, see own dashboard, follow others, join teams, set personal goals |
| Team Member | Per team | See team dashboard and teammates' activity (per team visibility rules), complete team targets |
| Team Moderator | Per team | Approve join requests, remove members, create announcements |
| Team Admin / Owner | Per team | Everything above plus create/edit targets, change team settings, transfer ownership, delete team |
| Platform Admin | Global | Moderation, sync health, feature flags (internal) |

Roles are per team (a user can be admin of one team and member of another).

---

## 3. Feature list

### 3.1 MVP (build first)

1. **Auth**: email + password, GitHub and Google OAuth.
2. **Account linking** for Codeforces, LeetCode, AtCoder, CodeChef, HackerRank, etc with handle **ownership verification**.
3. **Activity sync**: pull submissions and contest participation, normalize into one schema.
4. **Personal dashboard**: today's activity, streak, heatmap, solved counts by platform and difficulty, rating graphs.
5. **Daily activity feed**: per day list of solved problems (with link, platform, difficulty, tags, time) and contests participated (rank, rating change).
6. **Contest calendar**: upcoming contests across platforms, filter by platform, add to Google/Apple calendar (.ics), reminders.
7. **Teams**: create, invite link, join request, roles, member list.
8. **Team dashboard**: aggregate activity, leaderboard (daily/weekly/monthly/all-time), member progress table.
9. **Targets**: team admin creates targets (see 3.3); members see progress bars automatically computed.
10. **Follow system and privacy** (see section 4).
11. **Responsive UI** with mobile bottom navigation, dark/light themes, PWA install.

### 3.2 Recommended v1.x features (the "best features" layer)

- **Streaks and consistency score** with grace days / freeze tokens.
- **Contest participation tracker**: who in my team is registered for the next contest; "I'm in" button; post-contest team summary (ranks, delta ratings, upsolve list).
- **Upsolve queue**: problems you attempted but didn't solve during a contest are automatically added to a personal list.
- **Problem recommendations** based on weak tags and rating.
- **Tag and topic analytics**: radar chart of strength by topic (DP, graphs, greedy...).
- **Personal goals** (e.g. 3 problems/day, reach CF 1600 by December).
- **Notifications**: in-app, web push, email digest; contest reminders (1 day, 1 hour, 10 min), target deadlines, follow requests.
- **Weekly report** email/PDF per user and per team.
- **Rival comparison**: head-to-head of two users (solved, rating, tags).
- **Badges and achievements** (first 100 solves, 30-day streak, rating milestones).
- **Team announcements and discussion board** (simple threaded posts per team).
- **Shared problem sets / playlists** curated by admin with per-member completion tracking.
- **Sheets import**: popular lists (Striver A2Z, Blind 75, NeetCode 150, CSES) as ready-made target templates.
- **Public share cards**: OG image generator for profile/streak (great for social growth).
- **Embeddable README widget** (SVG) showing stats.
- **Command palette** (Ctrl/Cmd+K) for developers.
- **Data export** (JSON/CSV) and account deletion.

### 3.3 Targets (team admin feature)

A target is a measurable goal with a deadline, assigned to the whole team or selected members.

Target types:

- `SOLVE_COUNT`: solve N problems (optional filters: platform, rating range, difficulty, tags).
- `SPECIFIC_PROBLEMS`: solve a given list of problems.
- `CONTEST_PARTICIPATION`: participate in specified contests / N contests.
- `RATING_GOAL`: reach rating X on a platform.
- `STREAK`: maintain N-day streak.
- `CUSTOM_CHECKLIST`: manual items checked by member, verified by admin.

Target fields: title, description, type, criteria (JSON), start, end, recurrence (none/daily/weekly), assignees, visibility, reward points. Progress is computed by the backend from synced submissions, not entered manually (except custom checklist).

---

## 4. Visibility and privacy model (important)

The rule: data is visible to people **inside the same team** or **connected via follow**, otherwise only if the profile is **public**.

**Profile visibility setting** (per user): `PUBLIC` | `FOLLOWERS_ONLY` | `PRIVATE`.

**Follow system:** follow requests (like Instagram). If the target is `PUBLIC`, a follow is instant; otherwise it needs approval. Mutual follow is not required.

**Granular toggles** (per user, each can be Everyone / Followers / Team members / Only me): activity feed, solved problem details, ratings, heatmap, linked handles, contest history.

**Access decision (viewer V looking at owner O):**

1. V == O: allow all.
2. V and O share at least one team: allow, subject to the team's `memberVisibility` setting (teams can require members to expose activity to teammates; users see this before joining).
3. V has an accepted follow on O: allow follower-level fields.
4. O.profileVisibility == PUBLIC: allow public-level fields only.
5. Otherwise: deny, show only display name and avatar with a "Request to follow" button (unless PRIVATE with hidden discoverability).

Implementation rule: a single server-side function `canView(viewerId, ownerId, field)` used by **every** query and API route. Never filter on the client. Add unit tests covering the full matrix. Optionally enforce a second layer with Postgres Row Level Security.

**Team privacy:** teams are `PUBLIC` (discoverable, join request), `PRIVATE` (invite link only), or `SECRET` (hidden). Leaderboards of a team are visible only to its members unless the admin makes them public.

---

## 5. Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 15+ (App Router), React, TypeScript strict | Server Components, Server Actions, Route Handlers; `output: 'standalone'` for Docker |
| Styling | Tailwind CSS + shadcn/ui + Radix | Design tokens via CSS variables |
| Animation | Framer Motion (motion) | Page transitions, micro-interactions |
| Charts | Recharts or visx; custom SVG heatmap |  |
| Database | **Neon Postgres** | Pooled connection for app, direct connection for migrations; branch per PR |
| ORM | Drizzle ORM + drizzle-kit | SQL-first, light, great with Neon |
| Auth | Auth.js (NextAuth v5) or Better Auth | Credentials, GitHub, Google; database sessions |
| Validation | Zod | Shared schemas for forms and API |
| Data fetching | TanStack Query on client, RSC on server |  |
| Background jobs | **pg-boss** (job queue on the same Postgres, no Redis needed) in a separate `worker` container | Alternative: BullMQ + Redis if you scale |
| Cache / rate limit | Postgres table or Upstash Redis (optional) | Needed to respect external API limits |
| Email | Resend or SMTP via Nodemailer + React Email |  |
| Push | Web Push (VAPID) via service worker |  |
| Testing | Vitest (unit), Testing Library, Playwright (E2E) |  |
| Lint/format | ESLint, Prettier, `tsc --noEmit`, Husky + lint-staged |  |
| Observability | Pino logs, Sentry, `/api/health`, optional OpenTelemetry |  |
| Containerization | Docker multi-stage, docker compose for local |  |
| CI/CD | GitHub Actions, GHCR registry | See section 13 |

---

## 6. Architecture

```
          Browser / PWA
               |
        Next.js app (web container)
   RSC + Server Actions + Route Handlers
               |
      Neon Postgres (pooled) <---- worker container (pg-boss)
                                       |
            Platform adapters (rate-limited fetchers)
   Codeforces API | LeetCode GraphQL | AtCoder (Kenkoooo + site) | CodeChef | Contest aggregator
```

- **web**: serves UI and API, never calls third-party platforms in the request path (except one-off verification).
- **worker**: runs scheduled and on-demand sync jobs, contest refresh, notifications, weekly reports, target recalculation.
- **Scheduler**: pg-boss cron schedules (or an external cron hitting a protected `/api/cron/*` route secured by a secret if you deploy on serverless).

Why a separate worker: external APIs are slow and rate limited; syncing in web requests will time out and hurt UX.

---

## 7. Platform integrations

All integrations live behind one **adapter interface** so adding a platform means adding one file.

```ts
interface PlatformAdapter {
  id: 'codeforces' | 'leetcode' | 'atcoder' | 'codechef' | string;
  verifyOwnership(handle: string, token: string): Promise<boolean>;
  fetchProfile(handle: string): Promise<ProfileSnapshot>;      // rating, rank, counts
  fetchSubmissions(handle: string, since: Date): Promise<NormalizedSubmission[]>;
  fetchContestHistory(handle: string): Promise<NormalizedContestResult[]>;
  fetchUpcomingContests(): Promise<NormalizedContest[]>;
}
```

Every adapter has: timeout, retry with exponential backoff, per-platform token-bucket rate limiter, circuit breaker, and writes run metadata to a `sync_runs` table for debugging.

### 7.1 Codeforces (P0, most reliable)

- Official public API: `https://codeforces.com/api/`.
- Endpoints: `user.info`, `user.status?handle=&from=&count=` (submissions with verdict, problem, rating, tags, `creationTimeSeconds`), `user.rating` (contest history), `contest.list` (upcoming = phase `BEFORE`), `contest.standings`.
- Limit: roughly 1 request per 2 seconds. Queue and space calls.
- Count a problem as solved when verdict is `OK`; de-duplicate by (contestId, index).
- Ownership verification: ask the user to submit a deliberately non-compiling solution to a specified problem within a few minutes, then check `user.status`.

### 7.2 LeetCode (P0, unofficial)

- No official public API. Use the site's GraphQL endpoint `https://leetcode.com/graphql` (queries such as `recentAcSubmissionList`, `userProfileCalendar`, `userContestRankingInfo`, `matchedUser` for difficulty counts).
- Recent accepted submissions are limited (around the latest 20), so **sync frequently** (every 15 to 30 min for active users) to avoid gaps; use the calendar for daily submission counts as a cross-check.
- Ownership verification: ask the user to put a generated token in their public profile summary, then read it.
- Risk: the schema can change or block requests. Keep the adapter isolated, add contract tests with recorded fixtures, and show a "sync degraded" state in the UI rather than failing.
- Consider an optional **browser extension** (v2) that reports accepted submissions directly; this is the most robust approach.

### 7.3 AtCoder (P1)

- Use the community API **AtCoder Problems (kenkoooo)**: user submissions (`/atcoder-api/v3/user/submissions?user=&from_second=`), problem difficulty estimates, contest list. Rating history from `https://atcoder.jp/users/<handle>/history/json`.
- Be polite: cache aggressively and keep concurrency low.
- Ownership verification: token in the profile affiliation field.

### 7.4 CodeChef (P1, best effort)

- No stable official public API. Options: public profile page parsing, the website's contest list endpoint (`/api/list/contests/all`), or an aggregator. Mark as "best effort" in the UI.
- Ownership verification: token in the profile name/bio if possible, else manual approval fallback.

### 7.5 Contest aggregator

- Use each platform's native contest source where available, and optionally the **clist.by** API (needs an API key) to cover many sites with one integration. Store in `contests` table, refresh every 30 min, dedupe by (platform, externalId).

### 7.6 Sync strategy

- **Initial backfill** on link (paged, background, progress shown in UI).
- **Incremental sync**: scheduled by activity (active users every 15-30 min, inactive hourly or daily).
- **Manual refresh** button with cooldown (e.g. 5 min).
- Idempotent upserts keyed by (platform, externalSubmissionId).
- Store timestamps in UTC; render in the user's timezone; "day" boundaries use the user's timezone.
- **Legal and ethics:** respect each site's terms and robots rules, identify the app with a User-Agent, cache, never store user passwords or session cookies, only public data.

---

## 8. Data model (Postgres)

Use UUID v7 or cuid2 primary keys, `created_at`/`updated_at` everywhere.

**Identity**

- `users`: id, email, password\_hash (nullable), username (unique), display\_name, avatar\_url, bio, timezone, profile\_visibility, discoverable, created\_at.
- `accounts`, `sessions`, `verification_tokens` (Auth.js tables).
- `privacy_settings`: user\_id, field, audience (`EVERYONE|FOLLOWERS|TEAM|ME`).
- `follows`: follower\_id, followee\_id, status (`PENDING|ACCEPTED|BLOCKED`), created\_at. Unique (follower\_id, followee\_id).

**Platform data**

- `platform_accounts`: id, user\_id, platform, handle, verified\_at, verification\_token, current\_rating, max\_rating, rank, last\_synced\_at, sync\_status, sync\_error.
- `problems`: id, platform, external\_id, title, url, difficulty\_label, rating (nullable), tags (text\[\]). Unique (platform, external\_id).
- `submissions`: id, platform\_account\_id, problem\_id, external\_submission\_id, verdict, language, submitted\_at (timestamptz), is\_contest, contest\_id (nullable). Unique (platform\_account\_id, external\_submission\_id). Index (platform\_account\_id, submitted\_at).
- `solves` (derived): user\_id, problem\_id, first\_solved\_at, solved\_in\_contest. Used for counts and targets.
- `contests`: id, platform, external\_id, name, url, starts\_at, duration\_seconds, type, phase.
- `contest_results`: platform\_account\_id, contest\_id, rank, rating\_before, rating\_after, solved\_count, participated\_at.
- `daily_activity` (rollup): user\_id, date (user tz), solved\_count, submissions\_count, contests\_count, points. PK (user\_id, date). Rebuilt by worker; powers heatmap and streaks.
- `sync_runs`: platform\_account\_id, started\_at, finished\_at, status, items\_fetched, error.

**Teams**

- `teams`: id, name, slug, description, visibility (`PUBLIC|PRIVATE|SECRET`), member\_visibility\_policy, avatar\_url, owner\_id, invite\_code.
- `team_members`: team\_id, user\_id, role (`OWNER|ADMIN|MODERATOR|MEMBER`), joined\_at, status (`ACTIVE|PENDING|INVITED`).
- `team_announcements`, `team_posts` (optional discussion).
- `targets`: id, team\_id (nullable for personal), created\_by, title, description, type, criteria jsonb, starts\_at, ends\_at, recurrence, points.
- `target_assignees`: target\_id, user\_id (empty = whole team).
- `target_progress`: target\_id, user\_id, current\_value, goal\_value, status, completed\_at, updated\_at.
- `problem_sets`, `problem_set_items` for curated lists.

**Engagement**

- `contest_registrations`: user\_id, contest\_id, status (`PLANNING|REGISTERED|DONE`).
- `upsolve_items`: user\_id, problem\_id, source\_contest\_id, status.
- `notifications`: user\_id, type, payload jsonb, read\_at, created\_at.
- `push_subscriptions`, `notification_preferences`, `badges`, `user_badges`.
- `audit_log`: actor\_id, action, entity, entity\_id, metadata, created\_at.

Plan indexes for the heavy queries: leaderboard by team and date range, daily feed by user and date, upcoming contests by `starts_at`.

---

## 9. API surface

Use Server Actions for mutations from the UI and Route Handlers for anything external or cacheable. All inputs validated with Zod, all responses typed, errors in a consistent `{ error: { code, message } }` shape. Rate limit auth and verification endpoints.

| Area | Endpoints (REST style) |
| --- | --- |
| Auth | `POST /api/auth/*` (Auth.js) |
| Me | `GET/PATCH /api/me`, `GET/PATCH /api/me/privacy` |
| Linking | `POST /api/platforms/:platform/link`, `POST .../verify`, `DELETE .../:id`, `POST .../:id/sync` |
| Activity | `GET /api/users/:username/activity?from&to`, `/stats`, `/heatmap`, `/ratings` |
| Contests | `GET /api/contests?platform&from&to`, `GET /api/contests/ics` |
| Social | `POST /api/follow/:username`, `POST /api/follow/requests/:id/accept` or `reject`, `GET /api/users/search?q=` |
| Teams | `POST /api/teams`, `GET /api/teams/:slug`, `POST /api/teams/:slug/join`, `.../invite`, `.../members/:id/role` |
| Team data | `GET /api/teams/:slug/leaderboard?range`, `/activity`, `/members` |
| Targets | `POST /api/teams/:slug/targets`, `GET .../targets`, `PATCH/DELETE .../targets/:id`, `GET .../targets/:id/progress` |
| Notifications | `GET /api/notifications`, `POST /api/push/subscribe` |
| System | `GET /api/health`, `/api/cron/*` (secret-protected) |

Real-time updates (live leaderboard, sync progress) via Server-Sent Events or short polling; WebSockets are not required for v1.

---

## 10. UI / UX specification

### 10.1 Design language: "terminal meets dashboard"

Developers like precision and personality, so lean into a **code-native aesthetic** without sacrificing readability.

- **Theme:** dark by default, with light and a few developer themes (Midnight, Dracula, Solarized, GitHub Dark, Catppuccin). User selectable, system-aware.
- **Typography:** a clean sans for UI (Inter or Geist) and a monospace (JetBrains Mono or Geist Mono) for numbers, handles, ratings, timestamps and heading accents.
- **Color:** neutral dark surfaces with one vivid accent (electric green or violet) plus platform colors for badges. Rating colors follow each platform's official rating tiers.
- **Surfaces:** bento-grid dashboard cards with subtle borders, soft glow on hover, glassmorphism only for overlays.
- **Motifs:** terminal-style section headers (`~/dashboard $`), blinking cursor accents, contribution-style heatmap in the accent color, ASCII-style empty states, confetti or pixel burst when a target is completed, streak flame with animated counter.
- **Command palette:** Ctrl/Cmd+K to jump anywhere, search users, teams, problems.
- **Keyboard shortcuts** on desktop (`g d` dashboard, `g c` contests, `g t` teams, `?` for help).
- **Motion:** 150-250 ms transitions, shared-element transitions between list and detail, skeleton loaders, respect `prefers-reduced-motion`.
- **Accessibility:** WCAG AA contrast, focus rings, full keyboard support, never color-only meaning.

### 10.2 Layout by device

**Desktop (>= 1024px):** collapsible left sidebar (Dashboard, Activity, Contests, Teams, Targets, Leaderboard, Explore, Settings), top bar with search/command palette, notifications, theme toggle, avatar. Main area uses a bento grid; right rail on dashboard for "Upcoming contests" and "Today's targets".

**Tablet (640-1023px):** collapsed icon rail instead of sidebar; two-column grid.

**Mobile (< 640px), app-like feel:**

- **Bottom navigation bar** with 5 items: Home, Activity, Contests, Teams, Profile. Optional floating center action (Sync now).
- Safe-area padding (`env(safe-area-inset-*)`), sticky top app bar with page title and actions.
- Large touch targets (min 44px), swipeable tabs (Today / Week / Month), pull-to-refresh to sync, bottom sheets instead of modals.
- Horizontal scroll chips for platform filters, collapsible cards, virtualized long lists.
- **PWA:** manifest, installable, offline shell, splash screen, app icons, web push, service worker caching of the last dashboard snapshot.

### 10.3 Key screens

1. **Landing page:** hero with live animated heatmap/terminal demo, feature grid, CTA, public leaderboard teaser.
2. **Onboarding:** pick username, link platforms (guided verification stepper), choose privacy, join or create team.
3. **Dashboard (home):** greeting + streak, "Today" card (solved today vs daily goal), 365-day heatmap, platform breakdown, rating charts, upcoming contests, active targets, team feed.
4. **Daily Activity:** date strip (swipe to change day) with timeline of that day's solves and contests; each item shows platform badge, problem title, rating, tags, time, outbound link. Week/month calendar toggle with daily counts.
5. **Contests:** list and calendar views, platform filters, countdown timers, "Register / Remind me / Add to calendar", team participation chips ("4 teammates in").
6. **Profile:** public-facing page respecting privacy rules; handles and ratings, heatmap, badges, stats, follow button.
7. **Teams list and Team page:** tabs: Overview, Leaderboard, Members, Targets, Activity, Announcements, Settings (admin only).
8. **Target builder (admin):** step form (type, criteria, schedule, assignees, preview), live progress per member, nudge button.
9. **Leaderboard:** daily, weekly, monthly, all-time; metric switch (problems, points, rating delta, streak).
10. **Explore:** discover public users and teams, trending streaks.
11. **Settings:** profile, linked accounts and sync health, privacy matrix, notifications, themes, data export, delete account.

### 10.4 Reusable components

`PlatformBadge`, `RatingChip`, `Heatmap`, `StreakCounter`, `ActivityTimeline`, `ContestCard` (live countdown), `TargetProgressBar`, `LeaderboardTable`, `BottomNav`, `CommandPalette`, `EmptyState`, `SyncStatusPill`.

---

## 11. Non-functional requirements

- **Performance:** LCP under 2.5 s on mid-range phones, dashboard API p95 under 300 ms; use rollup tables, Next cache tags and streaming with Suspense.
- **Scalability:** target 10k users in v1 without redesign; sync load is the bottleneck, so queue and rate limit. Scale web containers horizontally; worker concurrency is configurable.
- **Security:** OWASP basics, CSRF protection, secure cookies, argon2/bcrypt hashing, input validation, strict CSP headers, rate limiting, dependency scanning, secrets only in env, least-privilege DB roles, audit log for admin actions.
- **Privacy:** enforced server-side, data export/delete, minimal data collection.
- **Reliability:** idempotent jobs, retries with backoff, dead-letter queue, graceful degradation when a platform is down (show last synced time).
- **Observability:** structured logs, error tracking, `/api/health` (checks DB), job metrics, admin sync-health page.
- **i18n-ready:** keep strings extractable (next-intl) even if only English ships first.

---

## 12. Docker

### 12.1 Dockerfile (multi-stage, Next.js standalone)

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build && pnpm build:worker   # worker bundled to dist-worker/ with tsup/esbuild

FROM node:22-alpine AS web
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]

FROM node:22-alpine AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist-worker ./dist-worker
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist-worker/index.js"]
```

Set `output: 'standalone'` in `next.config.ts`. Build with `docker build --target web` and `--target worker`.

### 12.2 docker-compose (local development)

```yaml
services:
  web:
    build: { context: ., target: web }
    env_file: .env
    ports: ["3000:3000"]
    depends_on: [db]
  worker:
    build: { context: ., target: worker }
    env_file: .env
    depends_on: [db]
  db:               # local-only Postgres; production uses Neon
    image: postgres:16-alpine
    environment: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: devtrack }
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
volumes:
  pgdata:
```

Developers may instead point `DATABASE_URL` at a personal **Neon dev branch**. Provide a `docker-compose.dev.yml` override with hot reload (`pnpm dev` bind mount) for daily work.

### 12.3 Neon notes

- Use the **pooled** connection string (`-pooler` host) for the running web app, and the **direct** string for migrations (`DATABASE_URL_UNPOOLED`).
- `sslmode=require` always.
- pg-boss needs session-level features (LISTEN/NOTIFY, advisory locks), so give the **worker the direct connection** string, not the pooler.
- Neon scales to zero: expect cold-start latency on idle databases and make connection code retry once.
- Use **Neon branching**: one branch per pull request for E2E tests, deleted when the run or PR ends.

---

## 13. CI/CD pipeline (GitHub Actions)

### 13.1 Branching and environments

- `main` = production; PRs get preview/CI environments backed by Neon branches; optional `staging` environment.
- Trunk-based development with short-lived feature branches and required PR checks.
- GitHub Environments: `staging` and `production` (production needs manual approval).

### 13.2 CI workflow (on pull request and push to main)

```yaml
name: CI
on:
  pull_request:
  push: { branches: [main] }
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test --coverage          # Vitest incl. privacy matrix + adapter contract tests

  e2e:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: neondatabase/create-branch-action@v6   # ephemeral DB per run
        id: branch
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          api_key: ${{ secrets.NEON_API_KEY }}
          branch_name: ci-${{ github.run_id }}
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:migrate
        env: { DATABASE_URL_UNPOOLED: ${{ steps.branch.outputs.db_url }} }
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
        env: { DATABASE_URL: ${{ steps.branch.outputs.db_url_with_pooler }} }
      - uses: neondatabase/delete-branch-action@v3
        if: always()
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch: ${{ steps.branch.outputs.branch_id }}
          api_key: ${{ secrets.NEON_API_KEY }}

  docker-build:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with:
          context: .
          target: web
          load: true
          tags: devtrack-web:ci
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - uses: aquasecurity/trivy-action@0.28.0   # pin a released version, avoid @master
        with: { image-ref: devtrack-web:ci, severity: CRITICAL,HIGH, exit-code: "1" }
```

Pin third-party action versions (check the current latest tags when implementing). Additional checks: CodeQL, `pnpm audit`, Dependabot or Renovate, Conventional Commit lint, bundle size report, Lighthouse CI against the built app.

### 13.3 CD workflow (on push to `main` or version tag)

1. Build `web` and `worker` images, tag with git SHA (and `latest`), push to **GitHub Container Registry** (`ghcr.io/<org>/devtrack-web`, `devtrack-worker`).
2. Run **DB migrations** (`drizzle-kit migrate` using the direct Neon URL) as a gated step *before* rollout. Migrations must be backward compatible (expand/contract pattern) so old containers keep working during rollout.
3. Deploy, choose one:
   - **Option A (VPS with Docker):** SSH deploy step runs `docker compose pull && docker compose up -d` behind Caddy or Traefik (automatic HTTPS).
   - **Option B (managed containers):** Fly.io, Railway, Render, Google Cloud Run or AWS App Runner using the same images.
   - **Option C:** Kubernetes with Helm if you already run a cluster.
4. Smoke test: poll `/api/health`; roll back to the previous image tag automatically if it fails.
5. Notify via Slack/Discord webhook; create a GitHub Release with changelog (release-please or semantic-release).

Production deploys require approval from the `production` GitHub Environment. Store `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, OAuth keys, `NEON_API_KEY`, `SENTRY_AUTH_TOKEN` and the deploy SSH key as GitHub **encrypted secrets**, never in the repo. Prefer OIDC federation for cloud deploys over long-lived keys.

### 13.4 Branch protection

Require passing `quality`, `e2e`, `docker-build`; at least one review; branch up to date; no force-push to `main`.

---

## 14. Environment variables

```
DATABASE_URL=                 # Neon pooled (web)
DATABASE_URL_UNPOOLED=        # Neon direct (migrations, worker)
AUTH_SECRET=
AUTH_URL=
AUTH_GITHUB_ID=  AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=  AUTH_GOOGLE_SECRET=
RESEND_API_KEY=  EMAIL_FROM=
VAPID_PUBLIC_KEY=  VAPID_PRIVATE_KEY=
CLIST_API_KEY=  CLIST_USERNAME=   # optional contest aggregator
CRON_SECRET=
SENTRY_DSN=
APP_URL=
SYNC_USER_AGENT="DevTrack/1.0 (+https://yourdomain)"
```

Validate all env vars at boot with Zod (`env.ts`) and fail fast. Commit a `.env.example`, never `.env`.

---

## 15. Suggested repository structure

```
devtrack/
├─ src/
│  ├─ app/                      # Next.js routes
│  │  ├─ (marketing)/  (auth)/  (app)/dashboard|activity|contests|teams|settings
│  │  ├─ u/[username]/          # public profile
│  │  └─ api/
│  ├─ components/ui/            # shadcn primitives
│  ├─ components/features/      # heatmap, contest-card, bottom-nav ...
│  ├─ server/
│  │  ├─ db/ (schema.ts, migrations/, queries/)
│  │  ├─ auth/
│  │  ├─ privacy/can-view.ts    # single source of truth for visibility
│  │  ├─ services/              # activity, teams, targets, notifications
│  │  └─ platforms/             # codeforces.ts leetcode.ts atcoder.ts codechef.ts index.ts
│  ├─ worker/                   # pg-boss jobs: sync, contests, targets, digests
│  ├─ lib/  hooks/  styles/
│  └─ env.ts
├─ drizzle.config.ts
├─ tests/ (unit, e2e, fixtures/platform-responses)
├─ Dockerfile  docker-compose.yml
├─ .github/workflows/ (ci.yml, cd.yml, codeql.yml)  .github/dependabot.yml
├─ docs/ (ADRs, runbooks)
└─ README.md  CONTRIBUTING.md
```

---

## 16. Background jobs

| Job | Schedule | Purpose |
| --- | --- | --- |
| `sync-account` | on link, manual, adaptive 15-60 min | Fetch submissions and results for one platform account |
| `refresh-contests` | every 30 min | Update upcoming contests |
| `rollup-daily` | after each sync | Rebuild `daily_activity` for affected days |
| `recalc-targets` | after rollup + hourly | Update `target_progress`, notify on completion |
| `contest-reminders` | every 5 min | Send 1 day / 1 hour / 10 min reminders |
| `post-contest-summary` | contest end + 30 min | Pull results, build team summary and upsolve list |
| `weekly-digest` | Monday morning, per user timezone | Email report |
| `cleanup` | daily | Purge old sync runs and expired tokens |

All jobs are idempotent, with retry limits and dead-letter handling.

---

## 17. Delivery plan

| Phase | Scope | Outcome |
| --- | --- | --- |
| 0. Foundation (1 wk) | Repo, Next.js, Tailwind/shadcn, Drizzle + Neon, Docker, CI skeleton, auth | App deploys from `main` |
| 1. Core tracking (2 wks) | Codeforces + LeetCode adapters, verification, worker, rollups, personal dashboard, daily feed | Individual user value |
| 2. Contests (1 wk) | Contest ingestion, calendar, reminders, .ics | Upcoming contests live |
| 3. Social (1.5 wks) | Follow system, privacy engine + tests, public profiles | Privacy rules enforced |
| 4. Teams (2 wks) | Teams, roles, leaderboards, targets and progress engine | Admin can set targets |
| 5. Polish (1.5 wks) | Mobile bottom nav, PWA, push, themes, command palette, AtCoder + CodeChef | App-like experience |
| 6. Hardening (1 wk) | Load test, security review, Sentry, docs, CD with approvals and rollback | Production release |
| 7. Growth | Badges, recommendations, share cards, README widget, browser extension, more platforms | Differentiators |

---

## 18. Acceptance criteria (samples)

- A user can link a Codeforces handle, pass verification, and within 2 minutes see historical solves on the dashboard.
- The Daily Activity page for a date shows every accepted solve and contest participation for that day in the user's timezone, grouped by platform.
- A private user's activity is not retrievable via UI or API by a non-follower, non-teammate (automated tests for every endpoint).
- A team admin creates "Solve 20 problems rated 1200-1500 by Sunday"; each member's progress bar updates after their next sync without manual input.
- Upcoming contests from Codeforces, LeetCode, AtCoder and CodeChef appear in one list within 30 minutes of being announced.
- On a 375px-wide phone the app shows a bottom navigation bar, has no horizontal page scroll, and installs as a PWA.
- Pushing to `main` runs CI, builds images, runs migrations, deploys, passes the health check, and rolls back automatically on failure.
- Lighthouse 90+ for Performance, Accessibility and Best Practices on the landing page.

---

## 19. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| LeetCode/CodeChef lack official APIs and may break or block | Adapter isolation, fixture-based contract tests, degraded-state UI, tuned polling, optional browser extension |
| Codeforces rate limits | Global token bucket, queue, caching, staggered syncs |
| LeetCode history limited to recent submissions | Frequent syncing, calendar cross-check, backfill from solved counts, extension |
| Privacy leak via a missed query | Central `canView`, review checklist, test matrix, optional Postgres RLS |
| Fake handle claims | Mandatory ownership verification |
| Neon cold starts / connection limits | Pooled connection, retry logic, small pool sizes |
| Scope creep | Strict MVP list in section 3.1; everything else behind feature flags |

---

## 20. Kickoff prompt to paste into Cursor

> Read AGENTS.md and docs/SPEC.md fully. Do not write any code yet. Reply with 6 short bullets: (1) the tech stack, (2) the folder structure from section 15, (3) the web versus worker split, (4) the privacy rule and where canView lives, (5) the MVP scope from section 3.1, (6) the order of tasks in section 21.6. Then wait for me to give you a task number (for example Task 0.1) and do only that task.

---

*Verify third-party API details (LeetCode GraphQL queries, AtCoder Problems endpoints, CodeChef endpoints, clist.by terms) and GitHub Action versions at implementation time, since unofficial endpoints and tags change without notice.*

---

## 21. Cursor build kit (for the Grok medium agent)

A mid-size agent works best with **small, explicit, verifiable tasks**. It tends to drift, invent library APIs, or skip steps when given a huge spec at once. So do not paste this whole document as one prompt. Put the spec in the repo and drive the agent one task at a time.

### 21.1 Setup (do this once)

1. Create an empty repo and add this document as `docs/SPEC.md` (export it as Markdown from this doc).
2. Create `AGENTS.md` at the repo root (Cursor reads it) with the content in 21.2.
3. Create the rule files in `.cursor/rules/` from 21.3.
4. In Cursor, use **Agent mode** with the Grok model, and start a **new chat for every task** to keep context small and accurate.
5. In each prompt, reference the spec with `@docs/SPEC.md` and name the exact section.
6. Commit after every task that passes its check. If the agent breaks something, run `git reset --hard` and re-prompt with a tighter task.

### 21.2 AGENTS.md (paste as-is)

```md
# DevTrack agent instructions

Project spec: docs/SPEC.md (source of truth). Read the referenced section before coding.

## Stack (do not change without asking)
Next.js App Router + TypeScript strict, Tailwind + shadcn/ui, Drizzle ORM + drizzle-kit,
Neon Postgres, Auth.js, Zod, pg-boss worker, Vitest, Playwright, pnpm, Docker, GitHub Actions.

## Working rules
- Do ONE task per chat. Do not start work outside the task. Do not refactor unrelated files.
- Before using any library API you are not 100% sure of, check the installed version in
  package.json and read its docs/types in node_modules. Never invent APIs or flags.
- Install dependencies with `pnpm add`; never hand-edit lockfiles.
- After changes always run: `pnpm lint && pnpm typecheck && pnpm test`. Fix failures before finishing.
- If a command or test fails, show the error, fix the root cause, re-run. Do not disable tests or lint rules to pass.
- Never hardcode secrets. Add new env vars to src/env.ts (Zod) and .env.example.
- All data access that returns another user's data MUST go through src/server/privacy/can-view.ts.
- Database changes only through Drizzle migrations (`pnpm db:generate`, `pnpm db:migrate`).
- Third-party platform calls only inside src/server/platforms/* adapters, with timeout, retry and rate limit.
- Finish every task with: what changed, how to verify, and anything left undone.
```

### 21.3 Cursor rules (`.cursor/rules/*.mdc`)

**`.cursor/rules/ui.mdc`** (applies to `src/components/**` and `src/app/**`)

```md
---
description: UI conventions
globs: src/components/**,src/app/**
---
- Mobile first. Below 640px show the BottomNav (5 items: Home, Activity, Contests, Teams, Profile); no horizontal page scroll.
- Use shadcn/ui primitives, Tailwind tokens from CSS variables, dark theme default.
- Mono font for numbers, handles, ratings, timestamps; sans font for text.
- Respect prefers-reduced-motion; every interactive element is keyboard accessible with a visible focus ring.
- Use Server Components by default; add use client only when state, effects or browser APIs are needed.
- Every list or page needs loading (skeleton), empty and error states.
```

**`.cursor/rules/server.mdc`** (applies to `src/server/**` and `src/worker/**`)

```md
---
description: Server and data conventions
globs: src/server/**,src/worker/**
---
- Validate every input with Zod. Return errors as { error: { code, message } }.
- Store timestamps as timestamptz in UTC. Compute the day boundary in the user's timezone.
- Upserts must be idempotent (unique keys per spec section 8).
- Jobs must be idempotent and retry-safe. Log with pino, never console.log.
- Any query exposing another user's data calls canView(viewerId, ownerId, field).
```

### 21.4 Definition of done for every task

Lint, typecheck and tests pass; no new `any` or disabled lint rules; env vars documented; README updated if setup changed; works at 375px and desktop widths for UI tasks; committed with a Conventional Commit message.

### 21.5 Prompt patterns that keep a mid-size agent on track

- **Name the files.** Create `src/server/privacy/can-view.ts` beats add a privacy system.
- **One concern per task.** If a task touches more than about 8 files, split it.
- **Ask for a plan first on risky tasks:** write, Before writing code, list the files you will create or change and wait. Then reply proceed.
- **Make it verify.** End prompts with the exact commands to run and require a short output summary.
- **Pin facts the model may guess wrong:** versions (Next.js, Auth.js, Drizzle) and unofficial APIs (LeetCode, CodeChef). Tell it to call the endpoint once, save the response as a fixture, and not guess field names.
- **When it loops or hallucinates:** start a new chat, paste only the failing error plus the relevant file, and ask for a minimal fix.
- **Review diffs yourself** for anything touching auth, privacy or migrations before committing.

### 21.6 Phase prompts (copy one per new chat)

Each prompt is deliberately narrow. Run the **Check** before moving on, then commit.

**Task 0.1 Scaffold**

> Read AGENTS.md and @docs/SPEC.md sections 5, 12 and 15. Create the Next.js app (App Router, TypeScript strict, pnpm) with Tailwind and shadcn/ui, ESLint, Prettier and Vitest. Add `output: 'standalone'`, `src/env.ts` with Zod validation, `.env.example`, and `/api/health` returning `{ ok: true }`. Use the folder structure from section 15 (empty folders with `.gitkeep` are fine). Do not build any features.
>
> **Check:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass; `/api/health` works.

**Task 0.2 Database**

> Read @docs/SPEC.md sections 8 and 12.3. Set up Drizzle with a Postgres driver suitable for a long-running Node server on Neon, `drizzle.config.ts` (migrations use `DATABASE_URL_UNPOOLED`), and scripts `db:generate`, `db:migrate`, `db:studio`. Implement the Identity and Platform data tables from section 8 in `src/server/db/schema.ts`, generate the first migration and apply it to my Neon dev branch. Extend `/api/health` to check the DB.
>
> **Check:** migration applied; health endpoint reports DB ok.

**Task 0.3 Docker**

> Read @docs/SPEC.md section 12. Add the multi-stage `Dockerfile` (targets `web` and `worker`) and `docker-compose.yml`. Add a stub worker entry `src/worker/index.ts` that connects pg-boss and logs worker started. Make `docker compose up --build` run web, worker and local Postgres.
>
> **Check:** `localhost:3000/api/health` returns ok inside Docker; worker logs started.

**Task 0.4 CI**

> Read @docs/SPEC.md section 13.2. Create `.github/workflows/ci.yml` with jobs quality and docker-build (add e2e with the Neon branch once Playwright tests exist). Add `.github/dependabot.yml`. Pin action versions to current releases. List the GitHub secrets and variables I must create.
>
> **Check:** workflow YAML is valid; a PR runs green.

**Task 0.5 Auth**

> Read @docs/SPEC.md sections 2 and 5. Implement Auth.js with credentials (argon2 or bcrypt), GitHub and Google OAuth, database sessions, sign-up with unique username, sign-in and sign-out pages, and a protected `(app)` layout. Add Vitest tests for password hashing and username validation.
>
> **Check:** can sign up, sign in, and reach a protected page.

**Task 1.1 Adapter interface + Codeforces**

> Read @docs/SPEC.md sections 7, 7.1 and 7.6. Create `src/server/platforms/types.ts` with the adapter interface and normalized types, a shared HTTP client with timeout, retry with backoff and a per-platform rate limiter, then implement the Codeforces adapter (profile, submissions, rating history, upcoming contests, ownership verification). Save real sample API responses under `tests/fixtures/codeforces/` and write Vitest contract tests against them (no network in tests).
>
> **Check:** tests pass offline.

**Task 1.2 Linking flow**

> Read @docs/SPEC.md sections 3.1 and 7.1. Build the linking UI and server actions: enter handle, show verification instructions and token, verify, store in `platform_accounts`. Handle the already-linked-handle error.

**Task 1.3 Worker sync**

> Read @docs/SPEC.md sections 6, 7.6 and 16. Implement pg-boss jobs `sync-account` (idempotent upserts into problems, submissions, solves, contest\_results) and `rollup-daily` (fills `daily_activity`). Trigger an initial backfill when an account is verified, and add a manual refresh action with a 5 minute cooldown. The worker uses `DATABASE_URL_UNPOOLED`.

**Task 1.4 LeetCode adapter**

> Same pattern as Task 1.1 for section 7.2. Call the real endpoint once to capture response shapes as fixtures, do not guess field names. On failure set the account sync\_status to degraded instead of throwing.

**Task 1.5 Dashboard and Daily Activity**

> Read @docs/SPEC.md sections 10.1 to 10.3. Build the dashboard (today card, streak, 365-day heatmap component, platform breakdown) and the Daily Activity page (date strip, timeline of solves and contests for the chosen day in the user's timezone). Include BottomNav for mobile and the sidebar for desktop, with skeleton, empty and error states.
>
> **Check:** works at 375px and 1280px widths.

**Task 2.1 Contests**

> Read @docs/SPEC.md sections 7.5 and 10.3. Add the `contests` table, a `refresh-contests` job (every 30 min), the Contests page (list, filters, live countdown) and an `.ics` export endpoint.

**Task 3.1 Privacy engine (before any social UI)**

> Read @docs/SPEC.md section 4 carefully. Implement `src/server/privacy/can-view.ts` exactly as the five-step decision list, plus `follows` and `privacy_settings` tables. Write an exhaustive Vitest matrix test: viewer is owner, teammate, accepted follower or stranger, against PUBLIC, FOLLOWERS\_ONLY and PRIVATE profiles, for each field. Do not build UI yet.
>
> **Check:** matrix tests pass.

**Task 3.2 Follow system and public profile**

> Build follow requests (instant for public profiles, approval otherwise) and the public profile page `u/[username]`. Every field must go through `canView`. Add a Playwright test proving a stranger cannot see a private user's activity.

**Task 4.1 Teams**

> Read @docs/SPEC.md sections 2, 4 and 8. Add team tables, create, join, invite link, roles and the member list, with permission checks per role.

**Task 4.2 Team leaderboard**

> Build daily, weekly, monthly and all-time leaderboards from `daily_activity`, visible to team members only unless the admin made it public.

**Task 4.3 Targets**

> Read @docs/SPEC.md section 3.3. Build the admin target builder, the `recalc-targets` job and member progress bars. Implement `SOLVE_COUNT` first, then add each other target type in its own task.

**Task 5.x Polish (one chat each)**

> PWA manifest and service worker; notifications and web push; themes; command palette; AtCoder adapter; CodeChef adapter.

**Task 6.1 CD**

> Read @docs/SPEC.md section 13.3. Create `.github/workflows/cd.yml`: build and push web and worker images to GHCR, run migrations, deploy (option A: SSH + docker compose), smoke test `/api/health`, roll back on failure, and require production environment approval.
