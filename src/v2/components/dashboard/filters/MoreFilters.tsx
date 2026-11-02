"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/v2/lib/cn";
import type {
  DifficultyKey,
  StatusKey,
} from "@/v2/components/dashboard/filters/types";

function ToggleChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "min-h-7 rounded-[var(--v2-radius-md)] border px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]",
        pressed
          ? "border-transparent bg-[var(--v2-primary)] text-white"
          : "border-[var(--v2-border)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)]",
      )}
    >
      {children}
    </button>
  );
}

export function MoreFilters({
  difficulty,
  status,
  activeCount,
  onDifficultyChange,
  onStatusChange,
}: {
  difficulty: DifficultyKey[];
  status: StatusKey[];
  activeCount: number;
  onDifficultyChange: (next: DifficultyKey[]) => void;
  onStatusChange: (next: StatusKey[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleDiff(key: DifficultyKey) {
    onDifficultyChange(
      difficulty.includes(key)
        ? difficulty.filter((d) => d !== key)
        : [...difficulty, key],
    );
  }

  function toggleStatus(key: StatusKey) {
    onStatusChange(
      status.includes(key) ? status.filter((s) => s !== key) : [...status, key],
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex min-h-8 items-center gap-1.5 rounded-[var(--v2-radius-md)] border px-2.5 text-[var(--v2-text-xs)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]",
          activeCount > 0
            ? "border-[var(--v2-primary)]/40 bg-[var(--v2-primary-muted)] text-[var(--v2-fg)]"
            : "border-[var(--v2-border)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)]",
        )}
      >
        <SlidersHorizontal className="size-3.5" aria-hidden />
        More filters
        {activeCount > 0 ? (
          <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--v2-primary)] px-1 text-[10px] text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="More filters"
          className="absolute right-0 top-[calc(100%+6px)] z-30 w-[min(18rem,calc(100vw-2rem))] rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-3 shadow-[var(--v2-shadow-md)]"
        >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--v2-fg-subtle)]">
            Difficulty
          </p>
          <p className="mb-2 text-[10px] text-[var(--v2-fg-subtle)]">
            Based on problem rating when available (Easy &lt;1200, Medium
            &lt;1600, Hard 1600+).
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(["easy", "medium", "hard"] as DifficultyKey[]).map((d) => (
              <ToggleChip
                key={d}
                pressed={difficulty.includes(d)}
                onClick={() => toggleDiff(d)}
              >
                {d[0]!.toUpperCase() + d.slice(1)}
              </ToggleChip>
            ))}
          </div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--v2-fg-subtle)]">
            Status
          </p>
          <p className="mb-2 text-[10px] text-[var(--v2-fg-subtle)]">
            Recent feed currently stores accepted solves only.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(["accepted", "failed"] as StatusKey[]).map((s) => (
              <ToggleChip
                key={s}
                pressed={status.includes(s)}
                onClick={() => toggleStatus(s)}
              >
                {s[0]!.toUpperCase() + s.slice(1)}
              </ToggleChip>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
