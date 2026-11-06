"use client";

import { useMemo } from "react";
import type { DashboardFiltersApi } from "@/v2/hooks/useDashboardFilters";
import type {
  PlatformStat,
  RecentSolve,
} from "@/v2/screens/DashboardScreen";
import type { DifficultyKey } from "@/v2/components/dashboard/filters/types";
import { platformLabel } from "@/v2/lib/platforms";

type Day = { date: string; count: number };

export type AcceptedSolveRow = {
  id: string;
  platform: string;
  title: string;
  url: string | null;
  rating: number | null;
  solvedAt: Date | string;
};

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fillWindow(
  from: Date,
  to: Date,
  counts: Map<string, number>,
): Day[] {
  const out: Day[] = [];
  const cur = new Date(from);
  cur.setHours(12, 0, 0, 0);
  const end = new Date(to);
  end.setHours(12, 0, 0, 0);
  while (cur <= end) {
    const key = toYmd(cur);
    out.push({ date: key, count: counts.get(key) ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function seriesToMap(series: Day[]): Map<string, number> {
  return new Map(series.map((d) => [d.date, d.count]));
}

function computeStreak(series: Day[], todayYmd: string): number {
  if (series.length === 0) return 0;
  const byDate = seriesToMap(series);
  let cursor = todayYmd;
  if ((byDate.get(cursor) ?? 0) === 0) {
    const y = new Date(`${todayYmd}T12:00:00`);
    y.setDate(y.getDate() - 1);
    cursor = toYmd(y);
  }
  let streak = 0;
  while (true) {
    const c = byDate.get(cursor) ?? 0;
    if (c <= 0) break;
    streak++;
    const prev = new Date(`${cursor}T12:00:00`);
    prev.setDate(prev.getDate() - 1);
    cursor = toYmd(prev);
  }
  return streak;
}

function lastActive(series: Day[]): string | null {
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i]!.count > 0) return series[i]!.date;
  }
  return null;
}

/** Rough CF-style rating → difficulty. LC often has null rating. */
export function ratingToDifficulty(
  rating: number | null | undefined,
): DifficultyKey | null {
  if (rating == null || !Number.isFinite(rating)) return null;
  if (rating < 1200) return "easy";
  if (rating < 1600) return "medium";
  return "hard";
}

function mergeSeries(maps: Map<string, number>[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of maps) {
    for (const [d, c] of m) {
      out.set(d, (out.get(d) ?? 0) + c);
    }
  }
  return out;
}

function inWindow(at: Date | string, from: Date, to: Date) {
  const t = new Date(at).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

export function useDashboardData({
  filtersApi,
  platforms,
  recent,
  acceptedSolves = [],
  heatmapAllTime,
  heatmapAllTimeByPlatform,
  heatmapYearOverride,
}: {
  filtersApi: DashboardFiltersApi;
  platforms: PlatformStat[];
  recent: RecentSolve[];
  /** First-AC rows — drives This week / in-range / difficulty (not calendar). */
  acceptedSolves?: AcceptedSolveRow[];
  heatmapAllTime: Day[];
  heatmapAllTimeByPlatform: Record<string, Day[]>;
  /** When set, heatmap uses this calendar year instead of filter range */
  heatmapYearOverride: number | null;
}) {
  const { selectedPlatforms, window, filters } = filtersApi;
  const todayYmd = toYmd(new Date());

  return useMemo(() => {
    const fromYmd = toYmd(window.from);
    const toYmdStr = toYmd(window.to);

    const perPlatformMaps = new Map<string, Map<string, number>>();
    for (const id of selectedPlatforms) {
      const series =
        heatmapAllTimeByPlatform[id] ??
        heatmapAllTime.map((d) => ({ ...d, count: 0 }));
      perPlatformMaps.set(id, seriesToMap(series));
    }

    const mergedMap = mergeSeries([...perPlatformMaps.values()]);

    // Activity / streak window = filter range (calendar / heatmap)
    const activitySeries = fillWindow(window.from, window.to, mergedMap);
    const activityByPlatform: Record<string, Day[]> = {};
    for (const id of selectedPlatforms) {
      activityByPlatform[id] = fillWindow(
        window.from,
        window.to,
        perPlatformMaps.get(id) ?? new Map(),
      );
    }

    // Heatmap window
    let heatFrom = window.from;
    let heatTo = window.to;
    if (heatmapYearOverride != null) {
      heatFrom = new Date(heatmapYearOverride, 0, 1, 12);
      heatTo =
        heatmapYearOverride === new Date().getFullYear()
          ? new Date()
          : new Date(heatmapYearOverride, 11, 31, 12);
    }
    const heatmapMerged = fillWindow(heatFrom, heatTo, mergedMap);
    const heatmapByPlatform: Record<string, Day[]> = {};
    for (const id of selectedPlatforms) {
      heatmapByPlatform[id] = fillWindow(
        heatFrom,
        heatTo,
        perPlatformMaps.get(id) ?? new Map(),
      );
    }

    const selectedStats = platforms.filter((p) =>
      selectedPlatforms.includes(p.platform),
    );
    const totalSolved = selectedStats.reduce((s, p) => s + p.solvedCount, 0);

    const weekFrom = new Date();
    weekFrom.setHours(0, 0, 0, 0);
    weekFrom.setDate(weekFrom.getDate() - 6);
    const weekTo = new Date();
    weekTo.setHours(23, 59, 59, 999);

    const scopedSolves = acceptedSolves.filter((s) =>
      selectedPlatforms.includes(s.platform),
    );

    let solvesInWindow = scopedSolves.filter((s) =>
      inWindow(s.solvedAt, window.from, window.to),
    );

    if (filters.difficulty.length > 0) {
      solvesInWindow = solvesInWindow.filter((s) => {
        const d = ratingToDifficulty(s.rating);
        return d != null && filters.difficulty.includes(d);
      });
    }

    const thisWeek = scopedSolves.filter((s) =>
      inWindow(s.solvedAt, weekFrom, weekTo),
    ).length;
    const solvesInRange = solvesInWindow.length;

    const streak = computeStreak(
      fillWindow(
        (() => {
          const d = new Date();
          d.setDate(d.getDate() - 400);
          return d;
        })(),
        new Date(),
        mergedMap,
      ),
      todayYmd,
    );

    const perPlatform = selectedPlatforms.map((id) => {
      const series = activityByPlatform[id] ?? [];
      const full = fillWindow(
        (() => {
          const d = new Date();
          d.setDate(d.getDate() - 400);
          return d;
        })(),
        new Date(),
        perPlatformMaps.get(id) ?? new Map(),
      );
      const stat = platforms.find((p) => p.platform === id);
      const platformSolves = solvesInWindow.filter((s) => s.platform === id);
      const ratings = platformSolves
        .map((r) => r.rating)
        .filter((r): r is number => r != null);
      const avgDifficulty =
        ratings.length > 0
          ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
          : null;
      return {
        platform: id,
        label: platformLabel(id),
        solvedCount: stat?.solvedCount ?? 0,
        solvesInRange: platformSolves.length,
        streak: computeStreak(full, todayYmd),
        lastActive: lastActive(full),
        avgRating: avgDifficulty,
      };
    });

    let filteredRecent = recent.filter((r) => {
      if (!selectedPlatforms.includes(r.platform)) return false;
      const t = new Date(r.submittedAt).getTime();
      return t >= window.from.getTime() && t <= window.to.getTime();
    });

    if (filters.difficulty.length > 0) {
      filteredRecent = filteredRecent.filter((r) => {
        const d = ratingToDifficulty(r.rating);
        return d != null && filters.difficulty.includes(d);
      });
    }

    filteredRecent = filteredRecent.filter(
      (r) => !r.verdict || r.verdict === "OK",
    );

    const scopeLabel =
      selectedPlatforms.length === platforms.length ||
      filters.platforms.length === 0
        ? "All platforms"
        : selectedPlatforms.length === 1
          ? platformLabel(selectedPlatforms[0]!)
          : `${selectedPlatforms.length} platforms`;

    const difficultyMix = {
      easy: 0,
      medium: 0,
      hard: 0,
      unknown: 0,
    };
    for (const r of solvesInWindow) {
      const d = ratingToDifficulty(r.rating);
      if (d == null) difficultyMix.unknown += 1;
      else difficultyMix[d] += 1;
    }
    const difficultyRated =
      difficultyMix.easy + difficultyMix.medium + difficultyMix.hard;

    return {
      fromYmd,
      toYmd: toYmdStr,
      scopeLabel,
      totalSolved,
      solvesInRange,
      thisWeek,
      streak,
      activitySeries,
      activityByPlatform,
      heatmapMerged,
      heatmapByPlatform,
      perPlatform,
      recent: filteredRecent,
      difficultyMix,
      difficultyRated,
      hasLinked: platforms.length > 0,
      emptyInRange:
        solvesInRange === 0 &&
        filteredRecent.length === 0 &&
        platforms.length > 0,
    };
  }, [
    selectedPlatforms,
    window,
    filters,
    platforms,
    recent,
    acceptedSolves,
    heatmapAllTime,
    heatmapAllTimeByPlatform,
    heatmapYearOverride,
    todayYmd,
  ]);
}
