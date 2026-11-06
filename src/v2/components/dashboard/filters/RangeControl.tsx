"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/v2/lib/cn";
import type { RangeKey } from "@/v2/components/dashboard/filters/types";

const PRESETS: Array<{ id: RangeKey; label: string }> = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "1y", label: "1y" },
  { id: "custom", label: "Custom" },
];

export function RangeControl({
  range,
  customFrom,
  customTo,
  onChange,
}: {
  range: RangeKey;
  customFrom: string | null;
  customTo: string | null;
  onChange: (range: RangeKey, custom?: { from?: string; to?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [from, setFrom] = useState(customFrom ?? "");
  const [to, setTo] = useState(customTo ?? "");

  useEffect(() => {
    setFrom(customFrom ?? "");
    setTo(customTo ?? "");
  }, [customFrom, customTo]);

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

  return (
    <div className="relative" ref={ref}>
      <div
        className="flex rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)]/80 p-0.5 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--v2-fg)_4%,transparent)]"
        role="group"
        aria-label="Time range"
      >
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={range === p.id}
            onClick={() => {
              if (p.id === "custom") {
                setOpen(true);
                onChange("custom", {
                  from: from || customFrom || undefined,
                  to: to || customTo || undefined,
                });
              } else {
                setOpen(false);
                onChange(p.id);
              }
            }}
            className={cn(
              "min-h-7 rounded-[6px] px-2.5 text-[var(--v2-text-xs)] font-medium transition-colors duration-[var(--v2-duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]",
              range === p.id
                ? "bg-[var(--v2-primary)] text-[var(--v2-on-primary)] shadow-[var(--v2-shadow-sm)]"
                : "text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Custom date range"
          className="absolute left-0 top-[calc(100%+6px)] z-30 w-[min(18rem,calc(100vw-2rem))] rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-3 shadow-[var(--v2-shadow-md)]"
        >
          <div className="grid gap-2">
            <label className="grid gap-1 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="min-h-8 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-2 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
              />
            </label>
            <label className="grid gap-1 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="min-h-8 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-2 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
              />
            </label>
            <button
              type="button"
              className="mt-1 min-h-8 rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] text-[var(--v2-text-xs)] font-medium text-[var(--v2-on-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]"
              onClick={() => {
                onChange("custom", { from, to });
                setOpen(false);
              }}
            >
              Apply range
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
