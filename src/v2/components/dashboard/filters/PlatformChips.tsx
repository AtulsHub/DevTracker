"use client";

import { cn } from "@/v2/lib/cn";
import { LINKABLE_PLATFORMS, platformColor, platformLabel } from "@/v2/lib/platforms";

export function PlatformChips({
  linked,
  selected,
  onToggle,
  onSelectAll,
  onLinkPlatform,
}: {
  linked: string[];
  selected: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  /** Called when user clicks an unlinked platform chip */
  onLinkPlatform?: (id: string) => void;
}) {
  const linkedSet = new Set(linked);
  const allSelected =
    selected.length === linked.length || selected.length === 0;
  const unlinked = LINKABLE_PLATFORMS.filter((id) => !linkedSet.has(id));

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Platform filter"
      >
        <button
          type="button"
          aria-pressed={allSelected}
          onClick={onSelectAll}
          disabled={linked.length === 0}
          className={cn(
            "min-h-8 rounded-[var(--v2-radius-md)] border px-2.5 text-[var(--v2-text-xs)] font-medium transition-colors duration-[var(--v2-duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]",
            allSelected
              ? "border-transparent bg-[var(--v2-primary)] text-[var(--v2-on-primary)]"
              : "border-[var(--v2-border)] bg-[var(--v2-bg)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)]",
          )}
        >
          All
        </button>
        {linked.map((id) => {
          const on = allSelected || selected.includes(id);
          const color = platformColor(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(id)}
              className={cn(
                "inline-flex min-h-8 items-center gap-1.5 rounded-[var(--v2-radius-md)] border px-2.5 text-[var(--v2-text-xs)] font-medium transition-colors duration-[var(--v2-duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]",
                on
                  ? "border-transparent text-white"
                  : "border-[var(--v2-border)] bg-[var(--v2-bg)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)]",
              )}
              style={on ? { background: color } : undefined}
            >
              <span
                className="size-1.5 rounded-full"
                style={{
                  background: on ? "rgba(255,255,255,0.9)" : color,
                }}
                aria-hidden
              />
              {platformLabel(id)}
            </button>
          );
        })}
      </div>

      {unlinked.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Platforms not linked yet"
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--v2-fg-subtle)]">
            Not linked
          </span>
          {unlinked.map((id) => (
            <button
              key={id}
              type="button"
              title={`Link ${platformLabel(id)} to include it in filters`}
              onClick={() => onLinkPlatform?.(id)}
              className="inline-flex min-h-7 items-center gap-1.5 rounded-[var(--v2-radius-md)] border border-dashed border-[var(--v2-border)] px-2 text-[11px] text-[var(--v2-fg-subtle)] transition-colors hover:border-[var(--v2-primary)] hover:text-[var(--v2-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]"
            >
              <span
                className="size-1.5 rounded-full opacity-60"
                style={{ background: platformColor(id) }}
                aria-hidden
              />
              {platformLabel(id)}
              <span className="text-[10px] text-[var(--v2-primary)]">Link</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
