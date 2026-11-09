import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { listAdminUsers } from "@/server/services/admin";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const users = await listAdminUsers(q);
  return NextResponse.json({ users });
}
