import { NextResponse } from "next/server";
import { getMaintenanceConfig } from "@/server/services/site-config";

/** Public maintenance status for banners / clients. */
export async function GET() {
  const maintenance = await getMaintenanceConfig();
  return NextResponse.json({
    enabled: maintenance.enabled,
    message: maintenance.enabled ? maintenance.message : null,
  });
}
