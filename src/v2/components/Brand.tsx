import Image from "next/image";
import { cn } from "@/v2/lib/cn";

const SYMBOL = "/logo/devtrack-symbol-transparent.png";
const LOGO_LIGHT = "/logo/devtrack-logo-light.png";
const LOGO_DARK = "/logo/devtrack-logo-dark.png";

type Size = "sm" | "md" | "lg" | "xl";

const MARK: Record<Size, { box: string; px: number }> = {
  sm: { box: "size-7", px: 28 },
  md: { box: "size-8", px: 32 },
  lg: { box: "size-10", px: 40 },
  xl: { box: "size-14", px: 56 },
};

/** Compact angular symbol — nav rails, loaders, chips. */
export function BrandMark({
  size = "sm",
  className,
  priority,
}: {
  size?: Size;
  className?: string;
  priority?: boolean;
}) {
  const m = MARK[size];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        m.box,
        className,
      )}
    >
      <Image
        src={SYMBOL}
        alt=""
        width={m.px}
        height={m.px}
        className="size-full object-contain"
        priority={priority}
      />
    </span>
  );
}

/** Full DEVTRACK lockup — switches light/dark with `data-theme`. */
export function BrandLogo({
  className,
  height = 28,
  priority,
}: {
  className?: string;
  /** Rendered height in px; width scales from asset aspect (~3.6:1). */
  height?: number;
  priority?: boolean;
}) {
  const width = Math.round(height * 3.6);
  return (
    <span
      className={cn("brand-logo relative inline-flex items-center", className)}
      style={{ height, width }}
    >
      <Image
        src={LOGO_LIGHT}
        alt="DevTrack"
        width={width}
        height={height}
        className="brand-logo-light h-full w-auto object-contain object-left"
        priority={priority}
      />
      <Image
        src={LOGO_DARK}
        alt="DevTrack"
        width={width}
        height={height}
        className="brand-logo-dark h-full w-auto object-contain object-left"
        priority={priority}
      />
    </span>
  );
}

/** Symbol + wordmark text — when a flat lockup PNG would look boxed. */
export function BrandLockup({
  size = "sm",
  className,
  labelClassName,
  showLabel = true,
}: {
  size?: Size;
  className?: string;
  labelClassName?: string;
  showLabel?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark size={size} />
      {showLabel ? (
        <span
          className={cn(
            "text-[var(--v2-text-sm)] font-semibold tracking-tight text-[var(--v2-fg)]",
            labelClassName,
          )}
        >
          DevTrack
        </span>
      ) : null}
    </span>
  );
}
