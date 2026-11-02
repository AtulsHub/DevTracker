/**
 * Re-export platform meta for dashboard filters/charts.
 * Prefer importing from here in dashboard feature code.
 */
import {
  PLATFORM_META,
  type PlatformId,
} from "@/v2/design/platforms";

export {
  PLATFORM_META,
  PLATFORMS,
  LINKABLE_PLATFORMS,
  type PlatformId,
  type PlatformMeta,
} from "@/v2/design/platforms";

export function platformLabel(id: string): string {
  return PLATFORM_META[id as PlatformId]?.label ?? id;
}

export function platformColor(id: string): string {
  return PLATFORM_META[id as PlatformId]?.color ?? "#7c3aed";
}

export function platformColorVar(id: string): string {
  return PLATFORM_META[id as PlatformId]?.colorVar ?? "var(--v2-primary)";
}
