import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { PlatformBadge } from "@/v2/components/Badge";
import { EmptyState } from "@/v2/components/EmptyState";
import { MetricCard } from "@/v2/components/MetricCard";
import { PageHeader } from "@/v2/components/PageHeader";
import type { ContestDto } from "@/v2/lib/api";
import { Flame, Link2, Target } from "lucide-react";

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
  const greeting = username ? username.split("@")[0] : null;

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader
        title={signedIn ? `Welcome back${greeting ? `, ${greeting}` : ""}` : "Home"}
        description="Contests, streaks, and linked platforms — one place."
        actions={
          signedIn ? (
            <Link href="/dashboard">
              <Button size="sm">Open dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-up">
                <Button size="sm">Get started</Button>
              </Link>
              <Link href="/contests">
                <Button size="sm" variant="secondary">
                  Browse contests
                </Button>
              </Link>
            </>
          )
        }
      />

      {next ? (
        <Card className="mb-6">
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--v2-fg-subtle)]">
                Next contest
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <PlatformBadge platform={next.platform} />
                <p className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  {next.name}
                </p>
              </div>
            </div>
            <p className="font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              {new Date(next.startsAt).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </CardBody>
        </Card>
      ) : null}

      {signedIn && quickStats ? (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <MetricCard
            label="Solved"
            value={quickStats.totalSolved}
            icon={Target}
          />
          <MetricCard
            label="Streak"
            value={`${quickStats.streak}d`}
            icon={Flame}
          />
          <MetricCard
            label="Platforms"
            value={quickStats.platforms}
            icon={Link2}
          />
        </div>
      ) : null}

      {featured && featured.length > 0 ? (
        <div className="mb-6">
          <div className="mb-3 flex items-end justify-between gap-2">
            <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              Public profiles
            </h2>
            <Link
              href="/explore"
              className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] no-underline hover:underline"
            >
              Explore
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {featured.slice(0, 8).map((u) => (
              <Link
                key={u.username}
                href={`/u/${u.username}`}
                className="min-w-[148px] shrink-0 rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-4 no-underline transition-colors hover:bg-[var(--v2-surface-hover)]"
              >
                <p className="truncate text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  {u.displayName ?? u.username}
                </p>
                <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                  @{u.username}
                </p>
                <p className="mt-2 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                  {u.totalSolved ?? 0} solved
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
            Upcoming contests
          </h2>
          <Link
            href="/contests"
            className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] no-underline hover:underline"
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
            <ul className="divide-y divide-[var(--v2-border-subtle)]">
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
