import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { getAdminStats } from "@/server/services/admin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const stats = await getAdminStats();
  return NextResponse.json({ stats });
}
