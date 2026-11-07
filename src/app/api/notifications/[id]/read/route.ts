import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { markNotificationRead } from "@/server/services/notifications";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await markNotificationRead(session.user.id, id);
  return NextResponse.json({ ok: true });
}
