import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { adminRefreshContests } from "@/server/services/admin";

export const maxDuration = 120;

export async function POST() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  try {
    const result = await adminRefreshContests(gate.admin.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Refresh failed" },
      { status: 500 },
    );
  }
}
