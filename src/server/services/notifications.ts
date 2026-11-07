import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { notifications } from "@/server/db/schema";

export type NotificationType =
  | "team_added"
  | "team_invited"
  | "team_join_approved"
  | "team_join_request"
  | "email_verified"
  | "contest_reminder";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
}) {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      payload: input.payload,
    })
    .returning({
      id: notifications.id,
      type: notifications.type,
      payload: notifications.payload,
      createdAt: notifications.createdAt,
      readAt: notifications.readAt,
    });
  return row;
}

export async function listNotifications(userId: string, limit = 30) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit: Math.min(limit, 50),
  });
}

export async function unreadNotificationCount(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    );
  return row?.count ?? 0;
}

export async function markNotificationRead(userId: string, id: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
