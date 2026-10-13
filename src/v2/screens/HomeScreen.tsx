import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { PlatformBadge } from "@/v2/components/Badge";
import { EmptyState } from "@/v2/components/EmptyState";
import type { ContestDto } from "@/v2/lib/api";

export function HomeScreen({
  signedIn,
  username,
  contests,
  quickStats,
  featured,
}: {
  signedIn: boolean;
  username?: string | null;
  contests: ContestDto[];
  quickStats?: {
    totalSolved: number;
    streak: number;
    platforms: number;
  } | null;
  featured?: Array<{
    username: string;
    displayName: string | null;
    totalSolved?: number;
  }>;
}) {
  const next = contests[0];
  const countdown = next
    ? formatCountdown(new Date(next.startsAt).getTime() - Date.now())
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      <section className="public-page-hero mb-6 rounded-none sm:rounded-[var(--v2-radius-xl)] sm:border sm:border-[var(--v2-border)]">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--v2-primary)]">
          Home
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.35rem)] font-bold tracking-tight text-[var(--v2-fg)]">
          {signedIn
            ? `Welcome back${username ? `, ${username.split("@")[0]}` : ""}`
            : "DevTrack"}
        </h1>
        <p className="mt-2 max-w-lg text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
          Contests, streaks, and linked platforms — one place.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {signedIn ? (
            <Link href="/dashboard">
              <Button>Open dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-up">
                <Button>Get started</Button>
              </Link>
              <Link href="/contests">
                <Button variant="secondary">Browse contests</Button>
              </Link>
            </>
          )}
        </div>
        {next ? (
          <div className="mt-6 max-w-lg border-t border-[var(--v2-border)] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--v2-fg-subtle)]">
              Next contest
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <PlatformBadge platform={next.platform} />
              <p className="font-semibold text-[var(--v2-fg)]">{next.name}</p>
            </div>
            <p className="mt-1 font-mono text-[var(--v2-text-sm)] text-[var(--v2-primary)]">
              Starts in {countdown}
            </p>
          </div>
        ) : null}
      </section>

      {signedIn && quickStats ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              Your snapshot
            </h2>
            <Link
              href="/dashboard"
              className="font-mono text-[var(--v2-text-xs)] text-[var(--v2-primary)] no-underline"
            >
              Dashboard
            </Link>
          </CardHeader>
          <CardBody className="grid grid-cols-3 gap-3 pt-0">
            <Stat label="Solved" value={quickStats.totalSolved} />
            <Stat label="Streak" value={`${quickStats.streak}d`} />
            <Stat label="Platforms" value={quickStats.platforms} />
          </CardBody>
        </Card>
      ) : null}

      {featured && featured.length > 0 ? (
        <div className="mb-6">
          <div className="mb-3 flex items-end justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-[var(--v2-text-lg)] font-bold">
              Public profiles
            </h2>
            <Link
              href="/explore"
              className="font-mono text-[var(--v2-text-xs)] text-[var(--v2-primary)] no-underline"
            >
              Explore
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {featured.slice(0, 8).map((u) => (
              <Link
                key={u.username}
                href={`/u/${u.username}`}
                className="min-w-[148px] shrink-0 rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-4 no-underline transition-transform hover:-translate-y-0.5"
              >
                <p className="truncate font-semibold text-[var(--v2-fg)]">
                  {u.displayName ?? u.username}
                </p>
                <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                  @{u.username}
                </p>
                <p className="mt-2 text-[var(--v2-text-xs)] text-[var(--v2-primary)]">
                  {u.totalSolved ?? 0} solved
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="text-[var(--v2-text-sm)] font-semibold">
            Upcoming contests
          </h2>
          <Link
            href="/contests"
            className="font-mono text-[var(--v2-text-xs)] text-[var(--v2-primary)] no-underline"
          >
            Calendar
          </Link>
        </CardHeader>
        <CardBody className="pt-0">
          {contests.length === 0 ? (
            <EmptyState
              title="No upcoming contests"
              description="Contest feed refreshes automatically. Check back soon."
            />
          ) : (
            <ul className="divide-y divide-[var(--v2-border)]">
              {contests.slice(0, 8).map((c) => (
                <li
                  key={`${c.platform}-${c.externalId}`}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <PlatformBadge platform={c.platform} />
                      <p className="truncate text-[var(--v2-text-sm)] font-medium">
                        {c.url ? (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                          >
                            {c.name}
                          </a>
                        ) : (
                          c.name
                        )}
                      </p>
                    </div>
                    <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                      {new Date(c.startsAt).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {c.durationSeconds
                        ? ` · ${Math.round(c.durationSeconds / 60)}m`
                        : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--v2-radius-md)] bg-[var(--v2-bg-muted)] p-3 text-center">
      <p className="font-mono text-[var(--v2-text-xl)] font-bold text-[var(--v2-primary)]">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
        {label}
      </p>
    </div>
  );
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}
