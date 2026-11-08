"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, Trophy } from "lucide-react";
import { LINKABLE_PLATFORMS, PLATFORMS } from "@/v2/design/platforms";
import { cn } from "@/v2/lib/cn";
import type { LeaderboardPerson } from "@/v2/lib/queries";
import { PlatformBadge } from "@/v2/components/Badge";

export type LeaderboardMetric =
  | "solved"
  | "best"
  | (typeof LINKABLE_PLATFORMS)[number];

const METRICS: Array<{ id: LeaderboardMetric; label: string }> = [
  { id: "best", label: "Best rating" },
  { id: "solved", label: "Total solved" },
  ...LINKABLE_PLATFORMS.map((id) => ({
    id,
    label: PLATFORMS[id].label,
  })),
];

function scoreFor(
  person: LeaderboardPerson,
  metric: LeaderboardMetric,
): number {
  if (metric === "solved") return person.totalSolved;
  if (metric === "best") return person.bestRating;
  return person.byPlatform[metric]?.rating ?? 0;
}

function secondaryFor(
  person: LeaderboardPerson,
  metric: LeaderboardMetric,
): string | null {
  if (metric === "solved") {
    return person.bestRating > 0 ? `Best rating ${person.bestRating}` : null;
  }
  if (metric === "best") {
    const top = Object.entries(person.byPlatform)
      .filter(([, v]) => (v?.rating ?? 0) > 0)
      .sort((a, b) => (b[1]?.rating ?? 0) - (a[1]?.rating ?? 0))[0];
    if (!top) {
      return person.totalSolved > 0 ? `${person.totalSolved} solved` : null;
    }
    const label =
      PLATFORMS[top[0] as keyof typeof PLATFORMS]?.label ?? top[0];
    return `${label} · ${top[1]!.rating}`;
  }
  const row = person.byPlatform[metric];
  if (!row) return null;
  const bits = [
    row.handle ? `@${row.handle}` : null,
    row.peak && row.peak !== row.rating ? `Peak ${row.peak}` : null,
  ].filter(Boolean);
  return bits.length ? bits.join(" · ") : null;
}

export function LeaderboardBoard({
  people,
  limit,
  variant = "app",
  className,
}: {
  people: LeaderboardPerson[];
  limit?: number;
  variant?: "app" | "landing";
  className?: string;
}) {
  const [metric, setMetric] = useState<LeaderboardMetric>("best");

  const ranked = useMemo(() => {
    const rows = people
      .map((p) => ({ person: p, score: scoreFor(p, metric) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.person.username.localeCompare(b.person.username);
      });
    return typeof limit === "number" ? rows.slice(0, limit) : rows;
  }, [people, metric, limit]);

  const landing = variant === "landing";
  const scoreUnit = metric === "solved" ? "solved" : "rating";
  const activeLabel =
    METRICS.find((m) => m.id === metric)?.label ?? "Best rating";

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: full-name dropdown */}
      <label className="relative block sm:hidden">
        <span className="sr-only">Leaderboard metric</span>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as LeaderboardMetric)}
          className={cn(
            "min-h-11 w-full appearance-none rounded-[var(--v2-radius-md)] border py-2.5 pl-3 pr-10 text-[var(--v2-text-sm)] font-semibold outline-none",
            landing
              ? "border-[var(--land-line)] bg-[var(--land-bg)] text-[var(--land-fg)] focus:border-[var(--land-accent)]"
              : "border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] text-[var(--v2-fg)] focus:border-[var(--v2-primary)]",
          )}
          aria-label="Leaderboard metric"
        >
          {METRICS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2",
            landing ? "text-[var(--land-muted)]" : "text-[var(--v2-fg-subtle)]",
          )}
          aria-hidden
        />
      </label>

      {/* Desktop: full-name chips */}
      <div
        className="hidden flex-wrap gap-1.5 sm:flex"
        role="tablist"
        aria-label="Leaderboard metric"
      >
        {METRICS.map((m) => {
          const active = metric === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMetric(m.id)}
              className={cn(
                "min-h-9 rounded-[var(--v2-radius-md)] px-3 text-[var(--v2-text-xs)] font-semibold transition-colors",
                active
                  ? landing
                    ? "bg-[var(--land-fg)] text-[var(--land-bg)]"
                    : "v2-btn-primary bg-[var(--v2-primary)]"
                  : landing
                    ? "border border-[var(--land-line)] bg-[var(--land-bg)] text-[var(--land-muted)] hover:text-[var(--land-fg)]"
                    : "border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] text-[var(--v2-fg-muted)] hover:text-[var(--v2-fg)]",
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <p
        className={cn(
          "mt-3 text-[11px] font-medium sm:hidden",
          landing ? "text-[var(--land-muted)]" : "text-[var(--v2-fg-subtle)]",
        )}
      >
        Showing · {activeLabel}
      </p>

      {ranked.length === 0 ? (
        <p
          className={cn(
            "mt-8 text-[var(--v2-text-sm)]",
            landing ? "text-[var(--land-muted)]" : "text-[var(--v2-fg-muted)]",
          )}
        >
          No public ratings for this board yet. Link a platform and stay
          discoverable to appear here.
        </p>
      ) : (
        <ol
          key={metric}
          className={cn(
            "mt-5 divide-y",
            landing
              ? "divide-[var(--land-line)] border-y border-[var(--land-line)]"
              : "divide-[var(--v2-border-subtle)] overflow-hidden rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] shadow-[var(--v2-shadow-sm)]",
          )}
        >
          {ranked.map(({ person: u, score }, i) => {
            const secondary = secondaryFor(u, metric);
            const top = i < 3;
            const podium =
              i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : null;
            return (
              <li
                key={u.username}
                className={cn(
                  top && "lb-rise",
                  podium === "gold" && "lb-podium-gold",
                  podium === "silver" && "lb-podium-silver",
                  podium === "bronze" && "lb-podium-bronze",
                )}
                style={top ? { animationDelay: `${i * 90}ms` } : undefined}
              >
                <Link
                  href={`/u/${u.username}`}
                  className={cn(
                    "group relative flex items-center gap-3 no-underline transition-colors sm:gap-4",
                    landing
                      ? "py-4 hover:bg-[var(--land-bg)]/70 sm:py-5"
                      : "px-3 py-3.5 hover:bg-[var(--v2-surface-hover)] sm:px-4",
                    top && "overflow-hidden",
                  )}
                >
                  {top ? (
                    <span
                      className={cn(
                        "lb-sheen pointer-events-none absolute inset-0 opacity-0",
                        podium === "gold" && "lb-sheen-gold",
                        podium === "silver" && "lb-sheen-silver",
                        podium === "bronze" && "lb-sheen-bronze",
                      )}
                      aria-hidden
                    />
                  ) : null}

                  <span
                    className={cn(
                      "relative flex w-9 shrink-0 flex-col items-center justify-center gap-0.5 font-mono text-[var(--v2-text-xs)] font-semibold tabular-nums",
                      landing
                        ? "text-[var(--land-muted)]"
                        : "text-[var(--v2-fg-subtle)]",
                      podium === "gold" && "text-amber-500",
                      podium === "silver" && "text-slate-400",
                      podium === "bronze" && "text-amber-700",
                    )}
                  >
                    {top ? (
                      <Trophy
                        className={cn(
                          "size-4",
                          podium === "gold" && "lb-trophy-pulse",
                          podium === "silver" && "lb-trophy-float",
                          podium === "bronze" && "lb-trophy-float",
                        )}
                        aria-hidden
                      />
                    ) : null}
                    <span>{String(i + 1).padStart(2, "0")}</span>
                  </span>

                  <div
                    className={cn(
                      "relative size-9 shrink-0 overflow-hidden rounded-[0.7rem] sm:size-10",
                      landing
                        ? "bg-[var(--land-bg)]"
                        : "bg-[var(--v2-primary-muted)]",
                      podium === "gold" && "lb-avatar-ring-gold",
                      podium === "silver" && "lb-avatar-ring-silver",
                      podium === "bronze" && "lb-avatar-ring-bronze",
                    )}
                  >
                    {u.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span
                        className={cn(
                          "flex size-full items-center justify-center text-sm font-semibold",
                          landing
                            ? "text-[var(--land-accent)]"
                            : "text-[var(--v2-primary)]",
                        )}
                      >
                        {(u.displayName ?? u.username).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate font-semibold tracking-tight",
                        landing
                          ? "landing-display text-lg text-[var(--land-fg)] sm:text-xl"
                          : "text-[var(--v2-text-sm)] text-[var(--v2-fg)] sm:text-[var(--v2-text-base)]",
                      )}
                    >
                      {u.displayName ?? u.username}
                      {i === 0 ? (
                        <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-[0.14em] text-amber-500">
                          #1
                        </span>
                      ) : null}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 truncate font-mono text-[11px]",
                        landing
                          ? "text-[var(--land-muted)]"
                          : "text-[var(--v2-fg-subtle)]",
                      )}
                    >
                      @{u.username}
                      {secondary ? ` · ${secondary}` : ""}
                    </p>
                    {metric === "best" || metric === "solved" ? (
                      <div className="mt-1.5 hidden flex-wrap gap-1 sm:flex">
                        {Object.keys(u.byPlatform)
                          .slice(0, 4)
                          .map((p) => (
                            <PlatformBadge key={p} platform={p} />
                          ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="relative shrink-0 text-right">
                    <p
                      className={cn(
                        "font-mono font-semibold tabular-nums",
                        landing
                          ? "text-base text-[var(--land-fg)] sm:text-lg"
                          : "text-[var(--v2-text-base)] text-[var(--v2-fg)]",
                        podium === "gold" && "lb-score-glow",
                      )}
                    >
                      {score.toLocaleString()}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] uppercase tracking-wide",
                        landing
                          ? "text-[var(--land-muted)]"
                          : "text-[var(--v2-fg-subtle)]",
                      )}
                    >
                      {scoreUnit}
                    </p>
                  </div>
                  <ArrowUpRight
                    className={cn(
                      "relative size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                      landing
                        ? "text-[var(--land-muted)] group-hover:text-[var(--land-fg)]"
                        : "text-[var(--v2-fg-subtle)] group-hover:text-[var(--v2-fg)]",
                    )}
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
