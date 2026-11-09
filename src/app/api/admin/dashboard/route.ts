import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { getAdminDashboard } from "@/server/services/admin";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const daysRaw = new URL(req.url).searchParams.get("days");
  const days = daysRaw ? Number.parseInt(daysRaw, 10) : 30;
  const dashboard = await getAdminDashboard(
    Number.isFinite(days) ? days : 30,
  );
  return NextResponse.json({ dashboard });
}
