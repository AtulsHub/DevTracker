import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  listNotifications,
  markAllNotificationsRead,
  unreadNotificationCount,
} from "@/server/services/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    listNotifications(session.user.id),
    unreadNotificationCount(session.user.id),
  ]);

  return NextResponse.json({ notifications: items, unread });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { all?: boolean };
  if (body.all) {
    await markAllNotificationsRead(session.user.id);
  }

  return NextResponse.json({ ok: true });
}
