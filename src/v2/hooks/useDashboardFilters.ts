"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_FILTERS,
  DIFFICULTY_KEYS,
  RANGE_KEYS,
  STATUS_KEYS,
  type DashboardFilterState,
  type DateWindow,
  type DifficultyKey,
  type RangeKey,
  type StatusKey,
} from "@/v2/components/dashboard/filters/types";
import { platformLabel } from "@/v2/lib/platforms";

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseRange(raw: string | null): RangeKey {
  if (raw && (RANGE_KEYS as readonly string[]).includes(raw)) {
    return raw as RangeKey;
  }
  return DEFAULT_FILTERS.range;
}

function isYmd(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function sanitizePlatforms(
  raw: string[],
  linked: string[],
): string[] {
  const linkedSet = new Set(linked);
  const cleaned = [...new Set(raw)].filter((p) => linkedSet.has(p));
  if (cleaned.length === 0) return [];
  if (
    linked.length > 0 &&
    cleaned.length === linked.length &&
    linked.every((p) => cleaned.includes(p))
  ) {
    return []; // encode "all" as empty
  }
  return cleaned;
}

export function resolveSelectedPlatforms(
  filters: DashboardFilterState,
  linked: string[],
): string[] {
  if (filters.platforms.length === 0) return [...linked];
  return filters.platforms.filter((p) => linked.includes(p));
}

export function resolveDateWindow(
  filters: DashboardFilterState,
  now = new Date(),
): DateWindow {
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  switch (filters.range) {
    case "7d":
      from.setDate(from.getDate() - 6);
      return { from, to, label: "Last 7 days" };
    case "30d":
      from.setDate(from.getDate() - 29);
      return { from, to, label: "Last 30 days" };
    case "90d":
      from.setDate(from.getDate() - 89);
      return { from, to, label: "Last 90 days" };
    case "1y":
      from.setDate(from.getDate() - 364);
      return { from, to, label: "Past year" };
    case "custom": {
      const customFrom = isYmd(filters.customFrom)
        ? new Date(`${filters.customFrom}T00:00:00`)
        : (() => {
            const d = new Date(now);
            d.setDate(d.getDate() - 29);
            d.setHours(0, 0, 0, 0);
            return d;
          })();
      const customTo = isYmd(filters.customTo)
        ? new Date(`${filters.customTo}T23:59:59.999`)
        : to;
      const a = customFrom <= customTo ? customFrom : customTo;
      const b = customFrom <= customTo ? customTo : customFrom;
      return {
        from: a,
        to: b,
        label: `${a.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${b.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`,
      };
    }
  }
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useDashboardFilters(linkedPlatforms: string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const linked = useMemo(
    () => [...new Set(linkedPlatforms.map((p) => p.toLowerCase()))].sort(),
    [linkedPlatforms],
  );

  const filters: DashboardFilterState = useMemo(() => {
    const platforms = sanitizePlatforms(
      parseList(searchParams.get("platforms")),
      linked,
    );
    const range = parseRange(searchParams.get("range"));
    const customFrom = isYmd(searchParams.get("from"))
      ? searchParams.get("from")
      : null;
    const customTo = isYmd(searchParams.get("to"))
      ? searchParams.get("to")
      : null;
    const compare = searchParams.get("compare") === "1";
    const difficulty = parseList(searchParams.get("difficulty")).filter(
      (d): d is DifficultyKey =>
        (DIFFICULTY_KEYS as readonly string[]).includes(d),
    );
    const status = parseList(searchParams.get("status")).filter(
      (s): s is StatusKey => (STATUS_KEYS as readonly string[]).includes(s),
    );

    const selectedCount =
      platforms.length === 0 ? linked.length : platforms.length;

    return {
      platforms,
      range: range === "custom" && !customFrom && !customTo ? "30d" : range,
      customFrom: range === "custom" ? customFrom : null,
      customTo: range === "custom" ? customTo : null,
      compare: compare && selectedCount >= 2,
      difficulty,
      status,
    };
  }, [searchParams, linked]);

  const selectedPlatforms = useMemo(
    () => resolveSelectedPlatforms(filters, linked),
    [filters, linked],
  );

  const write = useCallback(
    (next: DashboardFilterState) => {
      const params = new URLSearchParams(searchParams.toString());
      const cleanedPlatforms = sanitizePlatforms(next.platforms, linked);

      if (cleanedPlatforms.length === 0) params.delete("platforms");
      else params.set("platforms", cleanedPlatforms.join(","));

      if (next.range === DEFAULT_FILTERS.range) params.delete("range");
      else params.set("range", next.range);

      if (next.range === "custom" && next.customFrom) {
        params.set("from", next.customFrom);
      } else {
        params.delete("from");
      }
      if (next.range === "custom" && next.customTo) {
        params.set("to", next.customTo);
      } else {
        params.delete("to");
      }

      const canCompare =
        resolveSelectedPlatforms(
          { ...next, platforms: cleanedPlatforms },
          linked,
        ).length >= 2;
      if (next.compare && canCompare) params.set("compare", "1");
      else params.delete("compare");

      if (next.difficulty.length) {
        params.set("difficulty", next.difficulty.join(","));
      } else {
        params.delete("difficulty");
      }
      if (next.status.length) params.set("status", next.status.join(","));
      else params.delete("status");

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [linked, pathname, router, searchParams],
  );

  const setPlatforms = useCallback(
    (platforms: string[]) => {
      let next = sanitizePlatforms(platforms, linked);
      if (next.length === 0 && platforms.length > 0) {
        // attempted empty → All
        next = [];
      }
      write({ ...filters, platforms: next });
    },
    [filters, linked, write],
  );

  const togglePlatform = useCallback(
    (id: string) => {
      const current = resolveSelectedPlatforms(filters, linked);
      const on = current.includes(id);
      let next: string[];
      if (on) {
        next = current.filter((p) => p !== id);
        if (next.length === 0) next = []; // All
      } else {
        next = [...current, id];
      }
      // If selecting all individually, store as All (empty)
      if (next.length === linked.length) next = [];
      else if (next.length > 0 && next.length < linked.length) {
        // keep explicit list
      }
      write({
        ...filters,
        platforms: next.length === linked.length ? [] : next,
        compare:
          (next.length === 0 ? linked.length : next.length) >= 2
            ? filters.compare
            : false,
      });
    },
    [filters, linked, write],
  );

  const selectAllPlatforms = useCallback(() => {
    write({ ...filters, platforms: [] });
  }, [filters, write]);

  const setRange = useCallback(
    (range: RangeKey, custom?: { from?: string; to?: string }) => {
      write({
        ...filters,
        range,
        customFrom: range === "custom" ? (custom?.from ?? filters.customFrom ?? toYmd(new Date(Date.now() - 29 * 86400000))) : null,
        customTo:
          range === "custom"
            ? (custom?.to ?? filters.customTo ?? toYmd(new Date()))
            : null,
      });
    },
    [filters, write],
  );

  const setCompare = useCallback(
    (compare: boolean) => {
      if (compare && selectedPlatforms.length < 2) return;
      write({ ...filters, compare });
    },
    [filters, selectedPlatforms.length, write],
  );

  const setDifficulty = useCallback(
    (difficulty: DifficultyKey[]) => write({ ...filters, difficulty }),
    [filters, write],
  );

  const setStatus = useCallback(
    (status: StatusKey[]) => write({ ...filters, status }),
    [filters, write],
  );

  const reset = useCallback(() => {
    write({ ...DEFAULT_FILTERS });
  }, [write]);

  const window = useMemo(() => resolveDateWindow(filters), [filters]);

  const isDefault = useMemo(() => {
    return (
      filters.platforms.length === 0 &&
      filters.range === DEFAULT_FILTERS.range &&
      !filters.compare &&
      filters.difficulty.length === 0 &&
      filters.status.length === 0
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.platforms.length > 0) n += 1;
    if (filters.range !== DEFAULT_FILTERS.range) n += 1;
    if (filters.compare) n += 1;
    if (filters.difficulty.length) n += 1;
    if (filters.status.length) n += 1;
    return n;
  }, [filters]);

  const moreFilterCount = filters.difficulty.length + filters.status.length;

  const summary = useMemo(() => {
    const plats =
      filters.platforms.length === 0
        ? "All platforms"
        : selectedPlatforms.map(platformLabel).join(", ");
    return `Showing: ${plats} · ${window.label}`;
  }, [filters.platforms.length, selectedPlatforms, window.label]);

  return {
    filters,
    linkedPlatforms: linked,
    selectedPlatforms,
    window,
    isDefault,
    activeFilterCount,
    moreFilterCount,
    summary,
    setPlatforms,
    togglePlatform,
    selectAllPlatforms,
    setRange,
    setCompare,
    setDifficulty,
    setStatus,
    reset,
  };
}

export type DashboardFiltersApi = ReturnType<typeof useDashboardFilters>;
