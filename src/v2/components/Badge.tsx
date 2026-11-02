import { cn } from "@/v2/lib/cn";
import { PLATFORMS, type PlatformId } from "@/v2/design/platforms";

export function Badge({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--v2-radius-md)] px-2 py-0.5 text-[11px] font-medium tracking-wide",
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}

/** Platform label badge — full name by default for clearer UX. */
export function PlatformBadge({
  platform,
  compact = false,
}: {
  platform: string;
  /** Use short code only in dense layouts (e.g. tiny calendar dots legend). */
  compact?: boolean;
}) {
  const meta = PLATFORMS[platform as PlatformId];
  const label = compact
    ? (meta?.short ?? platform.slice(0, 2).toUpperCase())
    : (meta?.label ?? platform);
  const color = meta?.colorVar ?? "var(--v2-primary)";
  return (
    <Badge
      className="border"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      {label}
    </Badge>
  );
}
