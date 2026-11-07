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
import { MetricCard } from "@/v2/components/MetricCard";
import { PageHeader } from "@/v2/components/PageHeader";
import { ActivityHeatmap } from "@/v2/components/ActivityHeatmap";
import { ActivityChart } from "@/v2/components/ActivityChart";
import { FilterBar } from "@/v2/components/dashboard/filters/FilterBar";
import { PlatformComparisonCard } from "@/v2/components/dashboard/PlatformComparisonCard";
import { ConnectedPlatformCard } from "@/v2/components/dashboard/ConnectedPlatformCard";
import { OverviewTargetsPanel } from "@/v2/components/dashboard/OverviewTargetsPanel";
import { SubmissionList } from "@/v2/components/dashboard/SubmissionList";
import { LINKABLE_PLATFORMS, PLATFORMS } from "@/v2/design/platforms";
import { platformColor, platformLabel } from "@/v2/lib/platforms";
import { useDashboardFilters } from "@/v2/hooks/useDashboardFilters";
import {
  useDashboardData,
  type AcceptedSolveRow,
} from "@/v2/hooks/useDashboardData";
import { v2Api, type TargetDto } from "@/v2/lib/api";
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
  verdict?: string | null;
  submittedAt: Date | string;
};

export function DashboardScreen(props: {
  totalSolved: number;
  streak: number;
  todaySolved: number;
  platforms: PlatformStat[];
  recent: RecentSolve[];
  acceptedSolves?: AcceptedSolveRow[];
  overviewTargets?: TargetDto[];
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
  acceptedSolves = [],
  overviewTargets = [],
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
  acceptedSolves?: AcceptedSolveRow[];
  overviewTargets?: TargetDto[];
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
    acceptedSolves,
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

  const heatmapPeriod =
    yearOverride != null ? String(yearOverride) : filtersApi.window.label;

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-8">
        <div>
          <PageHeader
            title="Overview"
            description="Your activity and platform progress, all in one place."
            className="mb-0"
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
                "mt-4 rounded-[var(--v2-radius-md)] border px-3 py-2 text-[var(--v2-text-xs)]",
                syncMsg.toLowerCase().includes("fail")
                  ? "border-[var(--v2-danger)]/30 bg-[var(--v2-danger)]/10 text-[var(--v2-danger)]"
                  : "border-[var(--v2-border)] bg-[var(--v2-bg-muted)] text-[var(--v2-fg-muted)]",
              )}
              role="status"
            >
              {syncMsg}
            </p>
          ) : null}
        </div>

        <FilterBar
          api={filtersApi}
          onLinkPlatform={(id) => {
            setPlatform(id as (typeof LINKABLE_PLATFORMS)[number]);
            setSheetOpen(true);
          }}
        />

        <section className="flex flex-col gap-3">
          <SectionHeading
            title="Stats"
            description={`${data.scopeLabel} · ${filtersApi.window.label}`}
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="Total solved"
              value={data.totalSolved.toLocaleString()}
              hint={breakdownHint ?? undefined}
              icon={Target}
            />
            <MetricCard
              label="This week"
              value={data.thisWeek.toLocaleString()}
              hint="Accepted · last 7 days"
              icon={TrendingUp}
            />
            <MetricCard
              label="Streak"
              value={data.streak === 1 ? "1 day" : `${data.streak} days`}
              hint={
                todaySolved > 0 ? `${todaySolved} solved today` : undefined
              }
              icon={Flame}
            />
            <MetricCard
              label="Platforms"
              value={platforms.length}
              hint={
                platforms.length === 0
                  ? "Connect to start"
                  : `${data.solvesInRange} in range`
              }
              icon={Link2}
            />
          </div>
        </section>

        <OverviewTargetsPanel initialTargets={overviewTargets} />

        <section>
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  Difficulty mix
                </h3>
                <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                  First accepted solves in range (same count as “in range”)
                </p>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              {data.difficultyRated + data.difficultyMix.unknown === 0 ? (
                <p className="text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                  No accepted solves with ratings in this period yet.
                </p>
              ) : (
                <>
                  <div
                    className="flex h-2.5 overflow-hidden rounded-[var(--v2-radius-full)] bg-[var(--v2-bg-muted)]"
                    aria-hidden
                  >
                    {(
                      [
                        {
                          key: "easy",
                          count: data.difficultyMix.easy,
                          color: "var(--v2-success)",
                        },
                        {
                          key: "medium",
                          count: data.difficultyMix.medium,
                          color: "var(--v2-warning)",
                        },
                        {
                          key: "hard",
                          count: data.difficultyMix.hard,
                          color: "var(--v2-danger)",
                        },
                        {
                          key: "unknown",
                          count: data.difficultyMix.unknown,
                          color: "var(--v2-fg-subtle)",
                        },
                      ] as const
                    ).map((seg) => {
                      const total =
                        data.difficultyRated + data.difficultyMix.unknown;
                      if (!seg.count || total === 0) return null;
                      return (
                        <div
                          key={seg.key}
                          className="h-full"
                          style={{
                            width: `${(seg.count / total) * 100}%`,
                            background: seg.color,
                          }}
                        />
                      );
                    })}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(
                      [
                        {
                          label: "Easy",
                          count: data.difficultyMix.easy,
                          hint: "<1200",
                        },
                        {
                          label: "Medium",
                          count: data.difficultyMix.medium,
                          hint: "<1600",
                        },
                        {
                          label: "Hard",
                          count: data.difficultyMix.hard,
                          hint: "1600+",
                        },
                        {
                          label: "Unrated",
                          count: data.difficultyMix.unknown,
                          hint: "no rating",
                        },
                      ] as const
                    ).map((row) => (
                      <div key={row.label}>
                        <dt className="text-[10px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                          {row.label}
                        </dt>
                        <dd className="mt-0.5 font-mono text-[var(--v2-text-sm)] font-semibold tabular-nums text-[var(--v2-fg)]">
                          {row.count}
                        </dd>
                        <p className="text-[10px] text-[var(--v2-fg-subtle)]">
                          {row.hint}
                        </p>
                      </div>
                    ))}
                  </dl>
                </>
              )}
            </CardBody>
          </Card>
        </section>

        {compare ? (
          <PlatformComparisonCard
            rows={data.perPlatform}
            rangeLabel={filtersApi.window.label}
          />
        ) : null}

        <section className="flex flex-col gap-4">
          <SectionHeading
            title="Activity"
            description="Heatmap, chart, and recent accepted solves for the current filters."
          />

          <Card>
            <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  Contribution heatmap
                </h3>
                <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                  {heatmapPeriod}
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex min-w-[9rem] flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                    Year
                  </span>
                  <select
                    value={
                      heatmapYear === "filter" ? "filter" : String(heatmapYear)
                    }
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

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader>
                <div>
                  <h3 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                    Chart
                  </h3>
                  <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                    {filtersApi.window.label}
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
                  <h3 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                    Recent solves
                  </h3>
                  <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                    Accepted only · in range
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
                    href="/dashboard/submissions"
                    className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] no-underline hover:underline"
                  >
                    View all
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
                    title="No accepted solves in this period"
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
                        <SubmissionList items={list} showVerdict={false} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <SubmissionList items={data.recent} showVerdict={false} />
                )}
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t border-[var(--v2-border)] pt-8">
          <div className="flex items-end justify-between gap-3">
            <SectionHeading
              title="Connected platforms"
              description="Ratings and sync status from your accounts"
            />
            {platforms.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSheetOpen(true)}
              >
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
                const dimmed =
                  filtersApi.filters.platforms.length > 0 &&
                  !filtersApi.selectedPlatforms.includes(p.platform);
                return (
                  <ConnectedPlatformCard
                    key={p.id}
                    {...p}
                    dimmed={dimmed}
                    onSynced={() => router.refresh()}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

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

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
        {title}
      </h2>
      {description ? (
        <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

