import { cn } from "@/v2/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--v2-primary)] text-[var(--v2-fg-inverse)] hover:bg-[var(--v2-primary-hover)]",
  secondary:
    "bg-[var(--v2-bg-muted)] text-[var(--v2-fg)] border border-[var(--v2-border)] hover:bg-[var(--v2-border)]/40",
  ghost: "bg-transparent text-[var(--v2-fg-muted)] hover:bg-[var(--v2-bg-muted)]",
  danger: "bg-[var(--v2-danger)] text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-[var(--v2-text-sm)]",
  md: "min-h-11 px-4 text-[var(--v2-text-sm)]",
  lg: "min-h-12 px-5 text-[var(--v2-text-base)]",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--v2-radius-md)] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v2-primary)] disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
