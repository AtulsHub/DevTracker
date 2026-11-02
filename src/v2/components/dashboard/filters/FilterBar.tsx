"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { PlatformChips } from "@/v2/components/dashboard/filters/PlatformChips";
import { RangeControl } from "@/v2/components/dashboard/filters/RangeControl";
import { MoreFilters } from "@/v2/components/dashboard/filters/MoreFilters";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { cn } from "@/v2/lib/cn";
import type { DashboardFiltersApi } from "@/v2/hooks/useDashboardFilters";

export function FilterBar({
  api,
  onLinkPlatform,
}: {
  api: DashboardFiltersApi;
  onLinkPlatform?: (platformId: string) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const canCompare = api.selectedPlatforms.length >= 2;

  const controls = (
    <div className="flex flex-col gap-3">
      <PlatformChips
        linked={api.linkedPlatforms}
        selected={api.filters.platforms}
        onToggle={api.togglePlatform}
        onSelectAll={api.selectAllPlatforms}
        onLinkPlatform={onLinkPlatform}
      />
      <div className="flex flex-wrap items-center gap-2">
        <RangeControl
          range={api.filters.range}
          customFrom={api.filters.customFrom}
          customTo={api.filters.customTo}
          onChange={api.setRange}
        />
        <MoreFilters
          difficulty={api.filters.difficulty}
          status={api.filters.status}
          activeCount={api.moreFilterCount}
          onDifficultyChange={api.setDifficulty}
          onStatusChange={api.setStatus}
        />
        <div className="relative">
          <button
            type="button"
            aria-pressed={api.filters.compare}
            disabled={!canCompare}
            title={
              canCompare
                ? "Compare selected platforms side by side"
                : "Select at least 2 platforms to compare"
            }
            onClick={() => api.setCompare(!api.filters.compare)}
            className={cn(
              "min-h-8 rounded-[var(--v2-radius-md)] border px-2.5 text-[var(--v2-text-xs)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]",
              api.filters.compare
                ? "border-transparent bg-[var(--v2-primary)] text-white"
                : "border-[var(--v2-border)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)]",
              !canCompare && "cursor-not-allowed opacity-50",
            )}
          >
            Compare
          </button>
        </div>
        {!api.isDefault ? (
          <button
            type="button"
            onClick={api.reset}
            className="min-h-8 px-2 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)] underline-offset-2 hover:text-[var(--v2-fg)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]"
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "sticky top-[var(--v2-topbar-h)] z-[30] -mx-4 mb-5 border-b border-[var(--v2-border)] px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6",
          "bg-[color-mix(in_srgb,var(--v2-bg)_82%,transparent)]",
        )}
      >
        {/* Desktop */}
        <div className="hidden md:block">{controls}</div>

        {/* Mobile trigger */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex min-h-9 items-center gap-2 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] px-3 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]"
          >
            <Filter className="size-3.5" aria-hidden />
            Filters
            {api.activeFilterCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--v2-primary)] px-1.5 text-[10px] text-white">
                {api.activeFilterCount}
              </span>
            ) : null}
          </button>
          {!api.isDefault ? (
            <button
              type="button"
              onClick={api.reset}
              className="text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)] underline-offset-2 hover:underline"
            >
              Reset
            </button>
          ) : null}
        </div>

        <p className="mt-2 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
          {api.summary}
        </p>
      </div>

      <BottomSheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Filters"
      >
        {controls}
        <button
          type="button"
          className="mt-4 w-full min-h-10 rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] text-[var(--v2-text-sm)] font-medium text-white"
          onClick={() => setMobileOpen(false)}
        >
          Done
        </button>
      </BottomSheet>
    </>
  );
}
