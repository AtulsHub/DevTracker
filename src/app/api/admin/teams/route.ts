import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { listAdminTeams } from "@/server/services/admin";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const teams = await listAdminTeams(q);
  return NextResponse.json({ teams });
}
