"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  Link2,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { EmptyState } from "@/v2/components/EmptyState";
import { PlatformBadge } from "@/v2/components/Badge";
import { MetricCard } from "@/v2/components/MetricCard";
import { PageHeader } from "@/v2/components/PageHeader";
import { ActivityHeatmap } from "@/v2/components/ActivityHeatmap";
import { ActivityChart } from "@/v2/components/ActivityChart";
import { FilterBar } from "@/v2/components/dashboard/filters/FilterBar";
import { PlatformComparisonCard } from "@/v2/components/dashboard/PlatformComparisonCard";
import { LINKABLE_PLATFORMS, PLATFORMS } from "@/v2/design/platforms";
import { platformColor, platformLabel } from "@/v2/lib/platforms";
import { useDashboardFilters } from "@/v2/hooks/useDashboardFilters";
import { useDashboardData } from "@/v2/hooks/useDashboardData";
import { v2Api } from "@/v2/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/v2/lib/cn";

export type PlatformStat = {
  id: string;
  platform: string;
  handle: string;
  currentRating: number | null;
  maxRating: number | null;
  rank: string | null;
  solvedCount: number;
  syncStatus: string;
  lastSyncedAt: Date | string | null;
  syncError: string | null;
};

export type RecentSolve = {
  id: string;
  platform: string;
  title: string;
  url: string | null;
  rating: number | null;
  submittedAt: Date | string;
};

function syncStatusLabel(status: string) {
  const s = status.toLowerCase();
  if (s.includes("error") || s.includes("fail")) return "Needs attention";
  if (s.includes("sync")) return "Syncing";
  if (s.includes("ok") || s.includes("success") || s.includes("idle")) {
    return "Connected";
  }
  return status || "Connected";
}

export function DashboardScreen(props: {
  totalSolved: number;
  streak: number;
  todaySolved: number;
  platforms: PlatformStat[];
  recent: RecentSolve[];
  heatmap: Array<{ date: string; count: number }>;
  heatmapByPlatform?: Record<string, Array<{ date: string; count: number }>>;
  heatmapAllTime?: Array<{ date: string; count: number }>;
  heatmapAllTimeByPlatform?: Record<
    string,
    Array<{ date: string; count: number }>
  >;
  heatmapPlatforms?: string[];
  heatmapActiveYears?: number[];
}) {
  return <DashboardScreenInner {...props} />;
}

function DashboardScreenInner({
  todaySolved,
  platforms,
  recent,
  heatmap,
  heatmapByPlatform = {},
  heatmapAllTime,
  heatmapAllTimeByPlatform = {},
  heatmapActiveYears = [],
}: {
  totalSolved: number;
  streak: number;
  todaySolved: number;
  platforms: PlatformStat[];
  recent: RecentSolve[];
  heatmap: Array<{ date: string; count: number }>;
  heatmapByPlatform?: Record<string, Array<{ date: string; count: number }>>;
  heatmapAllTime?: Array<{ date: string; count: number }>;
  heatmapAllTimeByPlatform?: Record<
    string,
    Array<{ date: string; count: number }>
  >;
  heatmapPlatforms?: string[];
  heatmapActiveYears?: number[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [platform, setPlatform] = useState(LINKABLE_PLATFORMS[0]!);
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [heatmapYear, setHeatmapYear] = useState<number | "filter">("filter");
  const [groupRecent, setGroupRecent] = useState(false);

  const linkedIds = useMemo(
    () => platforms.map((p) => p.platform),
    [platforms],
  );

  const filtersApi = useDashboardFilters(linkedIds);
  const yearOverride =
    typeof heatmapYear === "number" ? heatmapYear : null;

  const data = useDashboardData({
    filtersApi,
    platforms,
    recent,
    heatmapAllTime: heatmapAllTime ?? heatmap,
    heatmapAllTimeByPlatform:
      Object.keys(heatmapAllTimeByPlatform).length > 0
        ? heatmapAllTimeByPlatform
        : heatmapByPlatform,
    heatmapYearOverride: yearOverride,
  });

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [...new Set([...heatmapActiveYears, current])].sort((a, b) => b - a);
  }, [heatmapActiveYears]);

  const compare = filtersApi.filters.compare && data.perPlatform.length >= 2;

  const breakdownHint = useMemo(() => {
    if (!compare) return null;
    return data.perPlatform
      .map((p) => `${PLATFORMS[p.platform as keyof typeof PLATFORMS]?.short ?? p.label} ${p.solvedCount}`)
      .join(" · ");
  }, [compare, data.perPlatform]);

  async function syncAll() {
    setSyncMsg(null);
    setSyncing(true);
    try {
      const r = await v2Api.syncAll({ full: true });
      setSyncMsg(
        `Synced ${r.synced} platform(s) — full history refresh for heatmap`,
      );
      startTransition(() => router.refresh());
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function link() {
    setError(null);
    try {
      await v2Api.linkPlatform(platform, handle.trim());
      setSheetOpen(false);
      setHandle("");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Link failed");
    }
  }

  const emptyFilterActions = (
    <div className="flex flex-wrap justify-center gap-2">
      <Button size="sm" variant="secondary" onClick={() => filtersApi.setRange("1y")}>
        Try Past year
      </Button>
      <Button size="sm" variant="ghost" onClick={() => filtersApi.selectAllPlatforms()}>
        Include all platforms
      </Button>
    </div>
  );

  const recentGrouped = useMemo(() => {
    if (!groupRecent) return null;
    const map = new Map<string, RecentSolve[]>();
    for (const s of data.recent) {
      if (!map.has(s.platform)) map.set(s.platform, []);
      map.get(s.platform)!.push(s);
    }
    return [...map.entries()];
  }, [data.recent, groupRecent]);

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader
        title="Overview"
        description="Your activity and platform progress, all in one place."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              loading={syncing || pending}
              onClick={() => void syncAll()}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Sync
            </Button>
            <Button size="sm" onClick={() => setSheetOpen(true)}>
              <Link2 className="size-3.5" aria-hidden />
              Link platform
            </Button>
          </>
        }
      />

      {syncMsg ? (
        <p
          className={cn(
            "mb-4 rounded-[var(--v2-radius-md)] border px-3 py-2 text-[var(--v2-text-xs)]",
            syncMsg.toLowerCase().includes("fail")
              ? "border-[var(--v2-danger)]/30 bg-[var(--v2-danger)]/10 text-[var(--v2-danger)]"
              : "border-[var(--v2-border)] bg-[var(--v2-bg-muted)] text-[var(--v2-fg-muted)]",
          )}
          role="status"
        >
          {syncMsg}
        </p>
      ) : null}

      <FilterBar
        api={filtersApi}
        onLinkPlatform={(id) => {
          setPlatform(id as (typeof LINKABLE_PLATFORMS)[number]);
          setSheetOpen(true);
        }}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label={`Total solved · ${data.scopeLabel}`}
          value={data.totalSolved.toLocaleString()}
          hint={breakdownHint ?? "Lifetime across selection"}
          icon={Target}
        />
        <MetricCard
          label="This week"
          value={data.thisWeek.toLocaleString()}
          hint="Last 7 days · filtered"
          icon={TrendingUp}
        />
        <MetricCard
          label="Streak"
          value={data.streak === 1 ? "1 day" : `${data.streak} days`}
          hint={
            todaySolved > 0
              ? `${todaySolved} solved today`
              : "Based on selected platforms"
          }
          icon={Flame}
        />
        <MetricCard
          label="Linked platforms"
          value={platforms.length}
          hint={
            platforms.length === 0
              ? "Connect to start tracking"
              : `${data.solvesInRange} solves in range`
          }
          icon={Link2}
        />
      </div>

      {compare ? (
        <PlatformComparisonCard
          rows={data.perPlatform}
          rangeLabel={filtersApi.window.label}
        />
      ) : null}

      <Card className="mb-6">
        <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              Contribution heatmap
            </h2>
            <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
              {data.scopeLabel}
              {" · "}
              {yearOverride != null
                ? String(yearOverride)
                : filtersApi.window.label}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-[9rem] flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                Year
              </span>
              <select
                value={heatmapYear === "filter" ? "filter" : String(heatmapYear)}
                onChange={(e) => {
                  const v = e.target.value;
                  setHeatmapYear(v === "filter" ? "filter" : Number(v));
                }}
                className="min-h-9 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
                aria-label="Heatmap calendar year"
              >
                <option value="filter">Filter range</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            {yearOverride != null ? (
              <button
                type="button"
                onClick={() => setHeatmapYear("filter")}
                className="min-h-9 text-[var(--v2-text-xs)] text-[var(--v2-primary)] underline-offset-2 hover:underline"
              >
                Back to filter range
              </button>
            ) : null}
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-2">
          {data.emptyInRange && yearOverride == null ? (
            <EmptyState
              title="No solves in this period"
              description="Widen the range or include more platforms."
              action={emptyFilterActions}
              className="py-8"
            />
          ) : compare ? (
            data.perPlatform.map((p) => (
              <div key={p.platform} className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: platformColor(p.platform) }}
                    aria-hidden
                  />
                  <span className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg)]">
                    {p.label}
                  </span>
                </div>
                <ActivityHeatmap
                  data={data.heatmapByPlatform[p.platform] ?? []}
                  title={
                    <>
                      <span className="font-semibold tabular-nums">
                        {(data.heatmapByPlatform[p.platform] ?? []).reduce(
                          (s, d) => s + d.count,
                          0,
                        )}
                      </span>{" "}
                      submissions
                    </>
                  }
                />
              </div>
            ))
          ) : (
            <ActivityHeatmap
              data={data.heatmapMerged}
              byPlatform={
                filtersApi.selectedPlatforms.length > 1
                  ? data.heatmapByPlatform
                  : undefined
              }
            />
          )}
        </CardBody>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Activity
              </h2>
              <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                {data.scopeLabel} · {filtersApi.window.label}
                {compare ? " · stacked by platform" : null}
              </p>
            </div>
          </CardHeader>
          <CardBody className="pt-2">
            <ActivityChart
              data={data.activitySeries}
              compare={compare}
              seriesByPlatform={data.activityByPlatform}
              emptyActions={emptyFilterActions}
            />
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Recent solves
              </h2>
              <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                Filtered by selection and range
              </p>
            </div>
            <div className="flex items-center gap-2">
              {compare ? (
                <button
                  type="button"
                  aria-pressed={groupRecent}
                  onClick={() => setGroupRecent((v) => !v)}
                  className={cn(
                    "text-[var(--v2-text-xs)] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]",
                    groupRecent
                      ? "text-[var(--v2-primary)]"
                      : "text-[var(--v2-fg-subtle)] hover:text-[var(--v2-fg)]",
                  )}
                >
                  Group
                </button>
              ) : null}
              <Link
                href="/explore"
                className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] no-underline hover:underline"
              >
                Explore
              </Link>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {!data.hasLinked ? (
              <EmptyState
                title="No platforms linked"
                description="Connect Codeforces, LeetCode, or AtCoder to see solves here."
                className="py-8"
                action={
                  <Button size="sm" onClick={() => setSheetOpen(true)}>
                    Link a platform
                  </Button>
                }
              />
            ) : data.recent.length === 0 ? (
              <EmptyState
                title="No solves in this period"
                description="Nothing matched the current filters."
                className="py-8"
                action={emptyFilterActions}
              />
            ) : recentGrouped ? (
              <div className="space-y-4">
                {recentGrouped.map(([plat, list]) => (
                  <div key={plat}>
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-[var(--v2-fg-muted)]">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: platformColor(plat) }}
                        aria-hidden
                      />
                      {platformLabel(plat)}
                    </p>
                    <RecentList items={list} />
                  </div>
                ))}
              </div>
            ) : (
              <RecentList items={data.recent} />
            )}
          </CardBody>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              Connected platforms
            </h2>
            <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
              Ratings and sync status from your accounts
            </p>
          </div>
          {platforms.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setSheetOpen(true)}>
              Add
            </Button>
          ) : null}
        </div>

        {platforms.length === 0 ? (
          <Card>
            <EmptyState
              title="No platforms linked"
              description="Connect Codeforces, LeetCode, and more to populate this dashboard."
              action={
                <Button size="sm" onClick={() => setSheetOpen(true)}>
                  Link a platform
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {platforms.map((p) => {
              const meta = PLATFORMS[p.platform as keyof typeof PLATFORMS];
              const status = syncStatusLabel(p.syncStatus);
              const needsAttention =
                status === "Needs attention" || Boolean(p.syncError);
              const dimmed =
                filtersApi.filters.platforms.length > 0 &&
                !filtersApi.selectedPlatforms.includes(p.platform);
              return (
                <Card
                  key={p.id}
                  className={cn("overflow-hidden transition-opacity", dimmed && "opacity-45")}
                >
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <PlatformBadge platform={p.platform} />
                          <span
                            className={cn(
                              "rounded-[var(--v2-radius-full)] px-2 py-0.5 text-[10px] font-medium",
                              needsAttention
                                ? "bg-[var(--v2-danger)]/10 text-[var(--v2-danger)]"
                                : "bg-[var(--v2-success)]/10 text-[var(--v2-success)]",
                            )}
                          >
                            {status}
                          </span>
                        </div>
                        <a
                          href={meta?.profileUrl(p.handle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block truncate font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                        >
                          @{p.handle}
                        </a>
                        {p.rank ? (
                          <p className="mt-0.5 text-[var(--v2-text-xs)] capitalize text-[var(--v2-fg-subtle)]">
                            {p.rank}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[1.5rem] font-semibold tabular-nums text-[var(--v2-fg)]">
                          {p.solvedCount.toLocaleString()}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                          Solved
                        </p>
                      </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--v2-border-subtle)] pt-3 text-[var(--v2-text-sm)]">
                      <div>
                        <dt className="text-[10px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                          Rating
                        </dt>
                        <dd className="mt-0.5 font-mono font-medium tabular-nums text-[var(--v2-fg)]">
                          {p.currentRating ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                          Synced
                        </dt>
                        <dd className="mt-0.5 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                          {p.lastSyncedAt
                            ? formatRelativeTime(p.lastSyncedAt)
                            : "Never"}
                        </dd>
                      </div>
                    </dl>
                    {p.syncError ? (
                      <p className="mt-3 text-[var(--v2-text-xs)] text-[var(--v2-danger)]">
                        {p.syncError}
                      </p>
                    ) : null}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Link a platform"
      >
        <label className="mb-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--v2-fg-subtle)]">
            Platform
          </span>
          <select
            value={platform}
            onChange={(e) =>
              setPlatform(e.target.value as (typeof LINKABLE_PLATFORMS)[number])
            }
            className="min-h-9 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
          >
            {LINKABLE_PLATFORMS.map((id) => (
              <option key={id} value={id}>
                {PLATFORMS[id].label}
              </option>
            ))}
          </select>
        </label>
        <Input
          label={`${PLATFORMS[platform].label} handle`}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="username"
          error={error ?? undefined}
        />
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" onClick={() => void link()} loading={pending}>
            Link & sync
          </Button>
          <Button variant="ghost" onClick={() => setSheetOpen(false)}>
            Cancel
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function RecentList({ items }: { items: RecentSolve[] }) {
  return (
    <ul className="divide-y divide-[var(--v2-border-subtle)]">
      {items.map((s) => (
        <li
          key={s.id}
          className="flex items-start justify-between gap-3 py-3 first:pt-1"
        >
          <div className="min-w-0">
            <p className="truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                >
                  {s.title}
                </a>
              ) : (
                s.title
              )}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <PlatformBadge platform={s.platform} />
              {s.rating != null ? (
                <span className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                  {s.rating}
                </span>
              ) : null}
            </div>
          </div>
          <time className="shrink-0 font-mono text-[11px] text-[var(--v2-fg-subtle)]">
            {formatRelativeTime(s.submittedAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
