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
        "inline-flex items-center rounded-[var(--v2-radius-full)] px-2.5 py-0.5 font-mono text-[11px] font-semibold",
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: string }) {
  const meta = PLATFORMS[platform as PlatformId];
  const label = meta?.short ?? platform.slice(0, 2).toUpperCase();
  const color = meta?.colorVar ?? "var(--v2-primary)";
  return (
    <Badge
      className="border"
      style={{
        color,
        borderColor: color,
        background: "transparent",
      }}
    >
      {label}
    </Badge>
  );
}
