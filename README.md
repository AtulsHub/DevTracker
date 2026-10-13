# DevTrack

Track competitive programming / DSA progress across **Codeforces, LeetCode, HackerRank, AtCoder, and CodeChef**. Teams, leaderboards, and admin-set targets. Mobile-first UI with a bottom tab bar.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Drizzle · Neon Postgres · Auth.js · Vercel Cron · pnpm

## Setup

1. Create a [Neon](https://console.neon.tech) project.
2. Copy env template and fill values:

```bash
cp .env.example .env.local
```

Required at minimum:

- `DATABASE_URL` — Neon **pooled** connection string
- `DATABASE_URL_UNPOOLED` — Neon **direct** connection string (migrations)
- `AUTH_SECRET` — `openssl rand -base64 32` (at least 32 chars)
- `AUTH_URL` / `APP_URL` — `http://localhost:3000` locally
- `CRON_SECRET` — protect `/api/cron/*` (required in production)

Optional: GitHub/Google OAuth client IDs.

3. Install, migrate, run:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Health: `/api/health`.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Quality |
| `pnpm db:generate` | Create migration from schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Drizzle Studio |

## Architecture notes

- Platform sync runs via **Vercel Cron** hitting `/api/cron/*` (not a separate worker).
- Third-party calls live only under `src/server/platforms/`.
- Cross-user data must go through `src/server/privacy/can-view.ts`.
- Spec: [`docs/SPEC.md`](docs/SPEC.md).

## Mobile

Below `lg` (1024px): fixed bottom nav (Home, Activity, Contests, Teams, Profile) + sticky top bar + safe-area padding. Desktop: left sidebar.
