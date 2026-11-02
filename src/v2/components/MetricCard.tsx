import { cn } from "@/v2/lib/cn";
import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: { value: string; positive?: boolean } | null;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-4 transition-colors duration-[var(--v2-duration)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg-muted)]">
          {label}
        </p>
        {Icon ? (
          <span className="flex size-7 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]">
            <Icon className="size-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-mono text-[1.625rem] font-semibold tracking-tight text-[var(--v2-fg)] tabular-nums">
        {value}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {hint ? (
          <p className="text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
            {hint}
          </p>
        ) : null}
        {delta ? (
          <span
            className={cn(
              "font-mono text-[11px] font-medium",
              delta.positive === false
                ? "text-[var(--v2-danger)]"
                : delta.positive
                  ? "text-[var(--v2-success)]"
                  : "text-[var(--v2-fg-subtle)]",
            )}
          >
            {delta.value}
          </span>
        ) : null}
      </div>
    </div>
  );
}
