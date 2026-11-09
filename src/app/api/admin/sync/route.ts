import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { listRecentSyncRuns } from "@/server/services/admin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const runs = await listRecentSyncRuns();
  return NextResponse.json({ runs });
}
