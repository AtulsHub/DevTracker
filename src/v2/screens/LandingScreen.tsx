"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/v2/components/Button";
import { PlatformBadge } from "@/v2/components/Badge";
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
  const reduce = useReducedMotion();
  const next = contests[0];
  const ease = [0.22, 1, 0.36, 1] as const;
  const fade = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease },
        };

  return (
    <div className="landing-root -mt-[var(--v2-topbar-h)] overflow-x-hidden">
      {/* ── Hero: one composition ── */}
      <section className="landing-hero relative isolate flex min-h-[100dvh] flex-col justify-end pb-16 pt-[calc(var(--v2-topbar-h)+2.5rem)] sm:justify-center sm:pb-20 sm:pt-[calc(var(--v2-topbar-h)+3rem)]">
        <div className="landing-hero-bg" aria-hidden />
        <div className="landing-grid" aria-hidden />

        <div className="relative z-[1] mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div>
            <motion.p
              className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,4.25rem)] font-bold leading-[0.95] tracking-[-0.04em] text-[var(--v2-fg)]"
              {...fade(0)}
            >
              DevTrack
            </motion.p>
            <motion.h1
              className="mt-5 max-w-xl text-[clamp(1.35rem,3.5vw,1.85rem)] font-semibold leading-snug tracking-tight text-[var(--v2-fg)]"
              {...fade(0.08)}
            >
              All your platforms. One calm place to grind.
            </motion.h1>
            <motion.p
              className="mt-3 max-w-md text-[var(--v2-text-base)] leading-relaxed text-[var(--v2-fg-muted)]"
              {...fade(0.14)}
            >
              Contests, ratings, and public profiles across Codeforces, LeetCode,
              and more — without tab-hopping.
            </motion.p>
            <motion.div className="mt-7 flex flex-wrap gap-3" {...fade(0.2)}>
              <Link href="/sign-up">
                <Button size="lg">Start free</Button>
              </Link>
              <Link href="/contests">
                <Button size="lg" variant="secondary">
                  Browse contests
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="relative mx-auto w-full max-w-md lg:max-w-none"
            {...(reduce
              ? {}
              : {
                  initial: { opacity: 0, y: 28, scale: 0.98 },
                  animate: { opacity: 1, y: 0, scale: 1 },
                  transition: { duration: 0.7, delay: 0.18, ease },
                })}
          >
            <ProductVisual next={next} />
          </motion.div>
        </div>

        <motion.div
          className="relative z-[1] mx-auto mt-12 flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 sm:px-6"
          {...fade(0.28)}
        >
          <span className="text-[var(--v2-text-xs)] font-medium uppercase tracking-[0.14em] text-[var(--v2-fg-subtle)]">
            Syncs with
          </span>
          {LINKABLE_PLATFORMS.map((id) => (
            <span
              key={id}
              className="font-mono text-[var(--v2-text-xs)] font-semibold"
              style={{ color: PLATFORMS[id].colorVar }}
            >
              {PLATFORMS[id].label}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ── Contests ── */}
      <section className="border-t border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[var(--v2-fg)]">
                Upcoming contests
              </h2>
              <p className="mt-1 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                Local times. Filter by platform on the calendar.
              </p>
            </div>
            <Link
              href="/contests"
              className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-primary)] no-underline"
            >
              Full calendar →
            </Link>
          </div>

          {contests.length === 0 ? (
            <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              Contest feed is refreshing — check back shortly.
            </p>
          ) : (
            <ul className="grid gap-0 divide-y divide-[var(--v2-border)] border-y border-[var(--v2-border)]">
              {contests.slice(0, 6).map((c, i) => (
                <motion.li
                  key={`${c.platform}-${c.externalId}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                  {...(reduce
                    ? {}
                    : {
                        initial: { opacity: 0, x: -8 },
                        whileInView: { opacity: 1, x: 0 },
                        viewport: { once: true, margin: "-40px" },
                        transition: { delay: i * 0.04, duration: 0.4 },
                      })}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <PlatformBadge platform={c.platform} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--v2-fg)]">
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
                  <span className="font-mono text-[var(--v2-text-xs)] text-[var(--v2-primary)]">
                    {formatCountdown(
                      new Date(c.startsAt).getTime() - Date.now(),
                    )}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Profiles ── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[var(--v2-fg)]">
                Public coders
              </h2>
              <p className="mt-1 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                Browse open profiles — private ones stay locked.
              </p>
            </div>
            <Link
              href="/explore"
              className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-primary)] no-underline"
            >
              Explore →
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              Be the first public profile — create an account and open your
              visibility in Settings.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 6).map((u) => (
                <Link
                  key={u.username}
                  href={`/u/${u.username}`}
                  className="group block rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-5 no-underline transition-transform duration-300 hover:-translate-y-0.5 hover:border-[var(--v2-border-strong)]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-12 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)] font-[family-name:var(--font-display)] text-lg font-bold text-[var(--v2-primary)]"
                      aria-hidden
                    >
                      {(u.displayName ?? u.username).charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--v2-fg)] group-hover:text-[var(--v2-primary)]">
                        {u.displayName ?? u.username}
                      </p>
                      <p className="font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                        @{u.username}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                    {u.totalSolved ?? 0} solved
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="landing-cta relative overflow-hidden border-t border-[var(--v2-border)] py-20 sm:py-24">
        <div className="landing-cta-bg" aria-hidden />
        <div className="relative z-[1] mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-[var(--v2-fg)]">
            Link once. Track everywhere.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Free for personal use. Teams, streaks, and contest calendar included.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg">Create account</Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="ghost">
                Peek at Explore
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--v2-border)] py-8 text-center font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
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
    <div className="landing-visual relative">
      <div className="landing-visual-panel overflow-hidden rounded-[var(--v2-radius-xl)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] shadow-[var(--v2-shadow-lg)]">
        <div className="flex items-center justify-between border-b border-[var(--v2-border)] px-4 py-3">
          <span className="font-mono text-[11px] font-semibold text-[var(--v2-fg-subtle)]">
            Contest calendar
          </span>
          <span className="font-mono text-[11px] text-[var(--v2-primary)]">
            Live
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2 px-4 py-4">
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
                  className="size-2 rounded-full"
                  style={{ background: color }}
                />
              ) : null}
            </div>
          ))}
        </div>
        {next ? (
          <div className="border-t border-[var(--v2-border)] bg-[var(--v2-bg)] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--v2-fg-subtle)]">
              Next up
            </p>
            <div className="mt-1 flex items-center gap-2">
              <PlatformBadge platform={next.platform} />
              <p className="truncate text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                {next.name}
              </p>
            </div>
            <p className="mt-1 font-mono text-[var(--v2-text-xs)] text-[var(--v2-primary)]">
              in{" "}
              {formatCountdown(new Date(next.startsAt).getTime() - Date.now())}
            </p>
          </div>
        ) : (
          <div className="border-t border-[var(--v2-border)] px-4 py-4">
            <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              Contests sync across five platforms
            </p>
          </div>
        )}
      </div>
      <div className="landing-visual-orbit" aria-hidden />
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
