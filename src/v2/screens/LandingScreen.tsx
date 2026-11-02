import Link from "next/link";
import { Calendar, Compass, Link2, Users } from "lucide-react";
import { Button } from "@/v2/components/Button";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { PlatformBadge } from "@/v2/components/Badge";
import { MetricCard } from "@/v2/components/MetricCard";
import { PLATFORMS, LINKABLE_PLATFORMS } from "@/v2/design/platforms";
import type { ContestDto } from "@/v2/lib/api";

type Featured = {
  username: string;
  displayName: string | null;
  totalSolved?: number;
  platforms?: string[];
};

export function LandingScreen({
  contests,
  featured,
}: {
  contests: ContestDto[];
  featured: Featured[];
}) {
  const next = contests[0];

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      {/* Hero */}
      <section className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] font-mono text-[11px] font-bold text-white">
              DT
            </span>
            <span className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)]">
              DevTrack
            </span>
          </div>
          <h1 className="max-w-xl text-[1.75rem] font-semibold tracking-tight text-[var(--v2-fg)] sm:text-[2rem]">
            Track DSA progress across every platform
          </h1>
          <p className="mt-3 max-w-md text-[var(--v2-text-sm)] leading-relaxed text-[var(--v2-fg-muted)]">
            Contests, ratings, streaks, and public profiles for Codeforces,
            LeetCode, HackerRank, AtCoder, and CodeChef — in one workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/sign-up">
              <Button size="sm">Get started</Button>
            </Link>
            <Link href="/contests">
              <Button size="sm" variant="secondary">
                Browse contests
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--v2-fg-subtle)]">
              Syncs with
            </span>
            {LINKABLE_PLATFORMS.map((id) => (
              <span
                key={id}
                className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg-muted)]"
              >
                {PLATFORMS[id].label}
              </span>
            ))}
          </div>
        </div>

        <ProductVisual next={next} />
      </section>

      {/* Value props */}
      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Platforms"
          value="5+"
          hint="Linked in one place"
          icon={Link2}
        />
        <MetricCard
          label="Contests"
          value="Live"
          hint="Local timezone calendar"
          icon={Calendar}
        />
        <MetricCard
          label="Teams"
          value="Shared"
          hint="Targets & leaderboards"
          icon={Users}
        />
        <MetricCard
          label="Explore"
          value="Public"
          hint="Discover other coders"
          icon={Compass}
        />
      </section>

      {/* Contests */}
      <section className="mb-8">
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Upcoming contests
              </h2>
              <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                Times shown in your local timezone
              </p>
            </div>
            <Link
              href="/contests"
              className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] no-underline hover:underline"
            >
              Full calendar
            </Link>
          </CardHeader>
          <CardBody className="pt-0">
            {contests.length === 0 ? (
              <p className="py-6 text-center text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                Contest feed is refreshing — check back shortly.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--v2-border-subtle)]">
                {contests.slice(0, 6).map((c) => (
                  <li
                    key={`${c.platform}-${c.externalId}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <PlatformBadge platform={c.platform} />
                      <div className="min-w-0">
                        <p className="truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
                          {c.url ? (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="no-underline hover:text-[var(--v2-primary)]"
                            >
                              {c.name}
                            </a>
                          ) : (
                            c.name
                          )}
                        </p>
                        <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                          {new Date(c.startsAt).toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Profiles */}
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              Public profiles
            </h2>
            <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
              Only public accounts appear here
            </p>
          </div>
          <Link
            href="/explore"
            className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] no-underline hover:underline"
          >
            Explore
          </Link>
        </div>

        {featured.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-center text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                Be the first public profile — create an account and open your
                visibility in Settings.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 6).map((u) => (
              <Link
                key={u.username}
                href={`/u/${u.username}`}
                className="group no-underline"
              >
                <Card className="h-full transition-colors duration-[var(--v2-duration)] group-hover:border-[var(--v2-border-strong)] group-hover:bg-[var(--v2-surface-hover)]">
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-10 items-center justify-center rounded-full bg-[var(--v2-primary-muted)] text-sm font-semibold text-[var(--v2-primary)]"
                        aria-hidden
                      >
                        {(u.displayName ?? u.username).charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                          {u.displayName ?? u.username}
                        </p>
                        <p className="font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                          @{u.username}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                      {(u.totalSolved ?? 0).toLocaleString()} solved
                    </p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <Card className="mb-8">
        <CardBody className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[var(--v2-text-base)] font-semibold text-[var(--v2-fg)]">
              Link once. Track everywhere.
            </h2>
            <p className="mt-1 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              Free for personal use. Teams, streaks, and contest calendar
              included.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/sign-up">
              <Button size="sm">Create account</Button>
            </Link>
            <Link href="/explore">
              <Button size="sm" variant="secondary">
                Explore
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      <footer className="border-t border-[var(--v2-border)] py-6 text-center font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
        DevTrack · DSA hub for competitive programmers
      </footer>
    </div>
  );
}

function ProductVisual({ next }: { next?: ContestDto }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dots = [
    null,
    "var(--v2-cf)",
    null,
    "var(--v2-lc)",
    "var(--v2-hr)",
    null,
    "var(--v2-ac)",
    null,
    null,
    "var(--v2-cc)",
    "var(--v2-cf)",
    null,
    "var(--v2-lc)",
    null,
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--v2-border)] px-4 py-3">
        <span className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg-muted)]">
          Contest calendar
        </span>
        <span className="rounded-[var(--v2-radius-full)] bg-[var(--v2-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--v2-success)]">
          Live
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 px-4 py-4">
        {days.map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="text-center font-mono text-[10px] text-[var(--v2-fg-subtle)]"
          >
            {d}
          </span>
        ))}
        {dots.map((color, i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-[var(--v2-radius-sm)] bg-[var(--v2-bg-muted)]"
          >
            {color ? (
              <span
                className="size-1.5 rounded-full"
                style={{ background: color }}
              />
            ) : null}
          </div>
        ))}
      </div>
      {next ? (
        <div className="border-t border-[var(--v2-border-subtle)] px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--v2-fg-subtle)]">
            Next up
          </p>
          <div className="mt-1 flex items-center gap-2">
            <PlatformBadge platform={next.platform} />
            <p className="truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
              {next.name}
            </p>
          </div>
          <p className="mt-1 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
            {new Date(next.startsAt).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      ) : (
        <div className="border-t border-[var(--v2-border-subtle)] px-4 py-4">
          <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Contests sync across five platforms
          </p>
        </div>
      )}
    </Card>
  );
}
