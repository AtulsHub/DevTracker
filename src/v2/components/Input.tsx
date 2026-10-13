import { cn } from "@/v2/lib/cn";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  label,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}) {
  const inputId = id ?? props.name;
  return (
    <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
      {label}
      <input
        id={inputId}
        className={cn(
          "min-h-11 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-fg)] outline-none transition-colors placeholder:text-[var(--v2-fg-subtle)] focus:border-[var(--v2-primary)] focus:ring-2 focus:ring-[var(--v2-primary-muted)]",
          error && "border-[var(--v2-danger)]",
          className,
        )}
        {...props}
      />
      {error ? (
        <span className="text-[var(--v2-text-xs)] text-[var(--v2-danger)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
