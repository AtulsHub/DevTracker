"use client";

import { useState } from "react";
import { Columns2, Filter, RotateCcw } from "lucide-react";
import { PlatformChips } from "@/v2/components/dashboard/filters/PlatformChips";
import { RangeControl } from "@/v2/components/dashboard/filters/RangeControl";
import { MoreFilters } from "@/v2/components/dashboard/filters/MoreFilters";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { cn } from "@/v2/lib/cn";
import { platformLabel } from "@/v2/lib/platforms";
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
  const platformScope =
    api.filters.platforms.length === 0
      ? "All platforms"
      : api.selectedPlatforms.map(platformLabel).join(", ");

  const controls = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--v2-fg-subtle)]">
          Platforms
        </p>
        <PlatformChips
          linked={api.linkedPlatforms}
          selected={api.filters.platforms}
          onToggle={api.togglePlatform}
          onSelectAll={api.selectAllPlatforms}
          onLinkPlatform={onLinkPlatform}
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--v2-border-subtle)] pt-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--v2-fg-subtle)]">
          Time &amp; options
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <RangeControl
            range={api.filters.range}
            customFrom={api.filters.customFrom}
            customTo={api.filters.customTo}
            onChange={api.setRange}
          />
          <MoreFilters
            difficulty={api.filters.difficulty}
            activeCount={api.moreFilterCount}
            onDifficultyChange={api.setDifficulty}
          />
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
              "inline-flex min-h-8 items-center gap-1.5 rounded-[var(--v2-radius-md)] border px-2.5 text-[var(--v2-text-xs)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]",
              api.filters.compare
                ? "border-transparent bg-[var(--v2-primary)] text-[var(--v2-on-primary)]"
                : "border-[var(--v2-border)] bg-[var(--v2-bg)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)]",
              !canCompare && "cursor-not-allowed opacity-50",
            )}
          >
            <Columns2 className="size-3.5" aria-hidden />
            Compare
          </button>
          {!api.isDefault ? (
            <button
              type="button"
              onClick={api.reset}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--v2-radius-md)] px-2 text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg-subtle)] transition-colors hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]"
            >
              <RotateCcw className="size-3" aria-hidden />
              Reset
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <section
        aria-label="Dashboard filters"
        className="relative overflow-visible rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] shadow-[var(--v2-shadow-sm)]"
      >
        <div
          className="h-1 w-full bg-[linear-gradient(90deg,var(--v2-primary),color-mix(in_srgb,var(--v2-primary)_35%,var(--v2-lc)),color-mix(in_srgb,var(--v2-primary)_20%,var(--v2-cf)))]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(90% 70% at 0% 0%, color-mix(in srgb, var(--v2-primary) 10%, transparent), transparent 55%)",
          }}
        />

        <div className="relative p-3.5 sm:p-4">
          <div className="mb-3.5 flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--v2-radius-md)] border border-[var(--v2-border-subtle)] bg-[var(--v2-bg)] text-[var(--v2-primary)]">
                <Filter className="size-3.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                    Filters
                  </h2>
                  {api.activeFilterCount > 0 ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--v2-primary)]">
                      {api.activeFilterCount} active
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--v2-fg-subtle)]">
                      Default view
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                  {platformScope}
                </p>
              </div>
            </div>

            <span className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border-subtle)] bg-[var(--v2-bg)]/70 px-2.5 py-1 font-mono text-[11px] tabular-nums text-[var(--v2-fg-muted)]">
              {api.window.label}
            </span>
          </div>

          <div className="hidden md:block">{controls}</div>

          <div className="flex items-center justify-between gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]"
            >
              <Filter className="size-3.5" aria-hidden />
              Adjust filters
              {api.activeFilterCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] px-1.5 text-[10px] text-[var(--v2-on-primary)]">
                  {api.activeFilterCount}
                </span>
              ) : null}
            </button>
            {!api.isDefault ? (
              <button
                type="button"
                onClick={api.reset}
                className="inline-flex min-h-9 items-center gap-1.5 px-2 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)] underline-offset-2 hover:underline"
              >
                <RotateCcw className="size-3" aria-hidden />
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <BottomSheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Filters"
      >
        {controls}
        <button
          type="button"
          className="mt-4 w-full min-h-10 rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] text-[var(--v2-text-sm)] font-medium text-[var(--v2-on-primary)]"
          onClick={() => setMobileOpen(false)}
        >
          Done
        </button>
      </BottomSheet>
    </>
  );
}
