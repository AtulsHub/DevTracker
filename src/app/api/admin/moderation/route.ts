import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin";
import { listModerationQueue } from "@/server/services/admin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const queue = await listModerationQueue();
  return NextResponse.json(queue);
}
