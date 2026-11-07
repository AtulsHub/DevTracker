import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Compass,
  Flame,
  LayoutDashboard,
  Link2,
  Users,
} from "lucide-react";
import { Card, CardBody } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { PlatformBadge } from "@/v2/components/Badge";
import { EmptyState } from "@/v2/components/EmptyState";
import { PageHeader } from "@/v2/components/PageHeader";
import type { ContestDto } from "@/v2/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/v2/lib/cn";

type FeaturedUser = {
  username: string;
  displayName: string | null;
  totalSolved?: number;
};

type ContinuePlatform = {
  platform: string;
  handle: string;
  lastSyncedAt: Date | string | null;
  syncError: string | null;
};

function asDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function contestStartsAt(c: ContestDto) {
  return asDate(c.startsAt).getTime();
}

function isWithinDays(value: string | Date, days: number) {
  const t = asDate(value).getTime();
  const now = Date.now();
  const end = now + days * 24 * 60 * 60 * 1000;
  return t >= now && t <= end;
}

function formatContestWhen(value: string | Date) {
  return asDate(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countdownLabel(value: string | Date) {
  const ms = asDate(value).getTime() - Date.now();
  if (ms <= 0) return "Starting soon";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

function todayNudge(todaySolved: number, streak: number) {
  if (todaySolved > 0) {
    return streak > 1
      ? `Streak alive — ${streak} days and counting.`
      : "Nice — you’re on the board today.";
  }
  if (streak > 0) {
    return `Solve one problem to keep your ${streak}-day streak.`;
  }
  return "One solve today starts a new streak.";
}

export function HomeScreen({
  username,
  contests,
  today,
  continuePlatform,
  needsLink,
  featured,
  activeTarget,
}: {
  username?: string | null;
  contests: ContestDto[];
  today: {
    todaySolved: number;
    streak: number;
    totalSolved: number;
  };
  continuePlatform?: ContinuePlatform | null;
  needsLink?: boolean;
  featured?: FeaturedUser[];
  activeTarget?: {
    title: string;
    current: number;
    goal: number;
    source: "personal" | "team";
    teamName: string | null;
  } | null;
}) {
  const greeting = username ? username.split("@")[0] : null;
  const sorted = [...contests].sort(
    (a, b) => contestStartsAt(a) - contestStartsAt(b),
  );
  const next = sorted[0];
  const upcomingWeek = sorted
    .filter((c) => isWithinDays(c.startsAt, 7))
    .slice(0, 5);
  const discover = (featured ?? []).slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-8">
        <PageHeader
          title={`Welcome back${greeting ? `, ${greeting}` : ""}`}
          description="What’s next today — contests, a quick nudge, then dive into Overview."
          className="mb-0"
          actions={
            <>
              <Link href="/dashboard">
                <Button size="sm">
                  Open Overview
                  <ArrowRight className="size-3.5" aria-hidden />
                </Button>
              </Link>
              {needsLink ? (
                <Link href="/dashboard">
                  <Button size="sm" variant="secondary">
                    <Link2 className="size-3.5" aria-hidden />
                    Link platform
                  </Button>
                </Link>
              ) : null}
            </>
          }
        />

        {/* Today */}
        <section className="overflow-hidden rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] shadow-[var(--v2-shadow-sm)]">
          <div
            className="h-1 w-full bg-[linear-gradient(90deg,var(--v2-primary),color-mix(in_srgb,var(--v2-primary)_40%,var(--v2-lc)))]"
            aria-hidden
          />
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--v2-fg-subtle)]">
                Today
              </p>
              <p className="mt-1 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
                {todayNudge(today.todaySolved, today.streak)}
              </p>
              <p className="mt-1 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                {today.totalSolved.toLocaleString()} solved all time
              </p>
            </div>
            <div className="flex shrink-0 gap-4 sm:gap-6">
              <div>
                <p className="font-mono text-[1.5rem] font-semibold tabular-nums text-[var(--v2-fg)]">
                  {today.todaySolved}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                  Solved today
                </p>
              </div>
              <div className="flex items-start gap-1.5">
                <Flame
                  className={cn(
                    "mt-1 size-4",
                    today.streak > 0
                      ? "text-[var(--v2-warning)]"
                      : "text-[var(--v2-fg-subtle)]",
                  )}
                  aria-hidden
                />
                <div>
                  <p className="font-mono text-[1.5rem] font-semibold tabular-nums text-[var(--v2-fg)]">
                    {today.streak}
                    <span className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)]">
                      d
                    </span>
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                    Streak
                  </p>
                </div>
              </div>
            </div>
          </div>
          {activeTarget ? (
            <div className="border-t border-[var(--v2-border-subtle)] px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--v2-fg-subtle)]">
                    Active target
                    {activeTarget.source === "team" && activeTarget.teamName
                      ? ` · ${activeTarget.teamName}`
                      : " · Personal"}
                  </p>
                  <p className="mt-0.5 truncate text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
                    {activeTarget.title}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[var(--v2-text-xs)] font-semibold tabular-nums text-[var(--v2-fg)]">
                    {activeTarget.current}/{activeTarget.goal}
                  </span>
                  <Link
                    href="/dashboard"
                    className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] no-underline hover:underline"
                  >
                    Overview
                  </Link>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-[var(--v2-radius-full)] bg-[var(--v2-bg-muted)]">
                <div
                  className="h-full rounded-[var(--v2-radius-full)] bg-[var(--v2-primary)]"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (activeTarget.current /
                          Math.max(activeTarget.goal, 1)) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </section>

        {needsLink ? (
          <Card>
            <EmptyState
              title="Link a platform to unlock Home"
              description="Connect Codeforces, LeetCode, or another site so streaks, sync, and contest reminders have something to work with."
              action={
                <Link href="/onboarding">
                  <Button size="sm">
                    Finish setup
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : null}

        {!activeTarget && !needsLink ? (
          <Card>
            <EmptyState
              title="No active target"
              description="Set a weekly problem goal so Overview can track progress."
              action={
                <Link href="/dashboard">
                  <Button size="sm" variant="secondary">
                    Set a target
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : null}

        {/* Next contest */}
        {next ? (
          <section>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--v2-fg-subtle)]">
              Next contest
            </p>
            <Card className="overflow-hidden">
              <div
                className="h-1 w-full bg-[var(--v2-primary)]"
                aria-hidden
              />
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <PlatformBadge platform={next.platform} />
                    <span className="rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--v2-primary)]">
                      {countdownLabel(next.startsAt)}
                    </span>
                  </div>
                  <h2 className="mt-2 truncate text-[1.125rem] font-semibold tracking-tight text-[var(--v2-fg)]">
                    {next.url ? (
                      <a
                        href={next.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                      >
                        {next.name}
                      </a>
                    ) : (
                      next.name
                    )}
                  </h2>
                  <p className="mt-1 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                    {formatContestWhen(next.startsAt)}
                    {next.durationSeconds
                      ? ` · ${Math.round(next.durationSeconds / 60)}m`
                      : ""}
                  </p>
                </div>
                <Link href="/contests">
                  <Button size="sm" variant="secondary">
                    Contest calendar
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </section>
        ) : null}

        {/* Upcoming this week */}
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Upcoming this week
              </h2>
              <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                Next few contests — full calendar lives under Contests
              </p>
            </div>
            <Link
              href="/contests"
              className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] no-underline hover:underline"
            >
              See all
            </Link>
          </div>

          <Card>
            <CardBody className="pt-2 sm:pt-3">
              {upcomingWeek.length === 0 ? (
                <EmptyState
                  title="No contests in the next 7 days"
                  description="Check the calendar for later events."
                  className="py-8"
                  action={
                    <Link href="/contests">
                      <Button size="sm" variant="secondary">
                        Open Contests
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-[var(--v2-border-subtle)]">
                  {upcomingWeek.map((c) => (
                    <li
                      key={`${c.platform}-${c.externalId}`}
                      className="flex items-start justify-between gap-3 py-3 first:pt-1"
                    >
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <PlatformBadge platform={c.platform} />
                          <p className="truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
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
                          {formatContestWhen(c.startsAt)}
                          {c.durationSeconds
                            ? ` · ${Math.round(c.durationSeconds / 60)}m`
                            : ""}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-[var(--v2-fg-muted)]">
                        {countdownLabel(c.startsAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </section>

        {/* Continue */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              Continue
            </h2>
            <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
              Pick up where your tracking left off
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard"
              className="group flex items-start gap-3 rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-4 no-underline shadow-[var(--v2-shadow-sm)] transition-[transform,border-color] duration-[var(--v2-duration)] hover:-translate-y-0.5 hover:border-[var(--v2-border-strong)]"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]">
                <LayoutDashboard className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)] group-hover:text-[var(--v2-primary)]">
                  Review Overview
                </span>
                <span className="mt-0.5 block text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                  Heatmap, filters, and recent solves
                </span>
              </span>
            </Link>

            {needsLink ? (
              <Link
                href="/dashboard"
                className="group flex items-start gap-3 rounded-[var(--v2-radius-lg)] border border-dashed border-[var(--v2-border)] bg-[var(--v2-bg)]/40 p-4 no-underline transition-colors hover:border-[var(--v2-primary)] hover:bg-[var(--v2-surface-hover)]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] text-[var(--v2-fg-muted)]">
                  <Link2 className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                    Link a platform
                  </span>
                  <span className="mt-0.5 block text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                    Connect Codeforces, LeetCode, and more
                  </span>
                </span>
              </Link>
            ) : continuePlatform ? (
              <Link
                href="/dashboard"
                className="group flex items-start gap-3 rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-4 no-underline shadow-[var(--v2-shadow-sm)] transition-[transform,border-color] duration-[var(--v2-duration)] hover:-translate-y-0.5 hover:border-[var(--v2-border-strong)]"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <PlatformBadge platform={continuePlatform.platform} />
                  </span>
                  <span className="mt-2 block text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)] group-hover:text-[var(--v2-primary)]">
                    @{continuePlatform.handle}
                  </span>
                  <span className="mt-0.5 block truncate text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                    {continuePlatform.syncError
                      ? "Needs sync attention"
                      : continuePlatform.lastSyncedAt
                        ? `Synced ${formatRelativeTime(continuePlatform.lastSyncedAt)}`
                        : "Never synced"}
                  </span>
                </span>
              </Link>
            ) : null}
          </div>
        </section>

        {/* Discover */}
        {discover.length > 0 ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  Discover
                </h2>
                <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                  Public profiles worth a look
                </p>
              </div>
              <Link
                href="/explore"
                className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] no-underline hover:underline"
              >
                Explore
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {discover.map((u) => (
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
          </section>
        ) : null}

        {/* Quick links */}
        <section className="flex flex-col gap-3 border-t border-[var(--v2-border)] pt-8">
          <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
            Quick links
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                {
                  href: "/contests",
                  label: "Contests",
                  icon: Calendar,
                },
                {
                  href: "/explore",
                  label: "Explore",
                  icon: Compass,
                },
                {
                  href: "/teams",
                  label: "Teams",
                  icon: Users,
                },
                {
                  href: "/dashboard",
                  label: "Overview",
                  icon: LayoutDashboard,
                },
              ] as const
            ).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] px-3 py-2.5 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)] no-underline transition-colors hover:bg-[var(--v2-surface-hover)]"
              >
                <item.icon
                  className="size-3.5 text-[var(--v2-fg-muted)]"
                  aria-hidden
                />
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
