/**
 * In-app contest reminders only — never sends email (Resend quota).
 * Notifies users who linked the contest platform and opted in.
 */
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/server/db";
import {
  contests,
  notifications,
  platformAccounts,
  users,
} from "@/server/db/schema";
import { createNotification } from "@/server/services/notifications";

/** Window: contests starting between now+45m and now+75m (≈1h reminder). */
const WINDOW_START_MS = 45 * 60 * 1000;
const WINDOW_END_MS = 75 * 60 * 1000;

export async function dispatchContestReminders() {
  const now = Date.now();
  const from = new Date(now + WINDOW_START_MS);
  const to = new Date(now + WINDOW_END_MS);

  const upcoming = await db.query.contests.findMany({
    where: and(gte(contests.startsAt, from), lte(contests.startsAt, to)),
    columns: {
      id: true,
      name: true,
      platform: true,
      startsAt: true,
      url: true,
    },
    limit: 40,
  });

  let created = 0;

  for (const contest of upcoming) {
    const accounts = await db
      .select({
        userId: platformAccounts.userId,
      })
      .from(platformAccounts)
      .innerJoin(users, eq(users.id, platformAccounts.userId))
      .where(
        and(
          eq(platformAccounts.platform, contest.platform),
          eq(users.contestRemindersEnabled, true),
        ),
      );

    const userIds = [...new Set(accounts.map((a) => a.userId))];

    for (const userId of userIds) {
      const recent = await db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, userId),
          eq(notifications.type, "contest_reminder"),
        ),
        orderBy: [desc(notifications.createdAt)],
        limit: 40,
        columns: { id: true, payload: true },
      });
      const already = recent.some((n) => {
        const p = n.payload as { contestId?: string } | null;
        return p?.contestId === contest.id;
      });
      if (already) continue;

      await createNotification({
        userId,
        type: "contest_reminder",
        payload: {
          contestId: contest.id,
          contestName: contest.name,
          platform: contest.platform,
          startsAt: contest.startsAt.toISOString(),
          href: "/contests",
          url: contest.url,
        },
      });
      created += 1;
    }
  }

  return { contests: upcoming.length, created };
}
