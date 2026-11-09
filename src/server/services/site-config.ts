/**
 * Site-wide config (maintenance mode, etc.).
 */
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { appSettings } from "@/server/db/schema";

const MAINTENANCE_KEY = "maintenance";

export type MaintenanceConfig = {
  enabled: boolean;
  message: string;
};

const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  enabled: false,
  message: "DevTrack is under maintenance. Please check back soon.",
};

export async function getMaintenanceConfig(): Promise<MaintenanceConfig> {
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, MAINTENANCE_KEY))
    .limit(1);
  if (!row?.value || typeof row.value !== "object") {
    return { ...DEFAULT_MAINTENANCE };
  }
  const v = row.value as Partial<MaintenanceConfig>;
  return {
    enabled: Boolean(v.enabled),
    message:
      typeof v.message === "string" && v.message.trim()
        ? v.message.trim()
        : DEFAULT_MAINTENANCE.message,
  };
}

export async function setMaintenanceConfig(
  next: Partial<MaintenanceConfig>,
): Promise<MaintenanceConfig> {
  const current = await getMaintenanceConfig();
  const value: MaintenanceConfig = {
    enabled: next.enabled ?? current.enabled,
    message:
      typeof next.message === "string" && next.message.trim()
        ? next.message.trim()
        : current.message,
  };

  await db
    .insert(appSettings)
    .values({
      key: MAINTENANCE_KEY,
      value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });

  return value;
}
