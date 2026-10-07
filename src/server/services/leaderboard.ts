/**
 * src/server/services/leaderboard.ts
 * Team leaderboard calculation.
 */
import { db } from "@/server/db";
import { dailyActivity, teamMembers, users } from "@/server/db/schema";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import { startOfWeek, endOfWeek, formatISO, subWeeks } from "date-fns";

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalSolved: number;
  rank: number;
}

/**
 * Get team leaderboard for a specific week.
 */
export async function getTeamLeaderboard(
  teamId: string,
  weekOffset = 0
): Promise<LeaderboardEntry[]> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const targetWeekStart = subWeeks(weekStart, weekOffset);
  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 });

  const weekStartStr = formatISO(targetWeekStart, { representation: "date" });
  const weekEndStr = formatISO(targetWeekEnd, { representation: "date" });

  const results = await db
    .select({
      userId: dailyActivity.userId,
      totalSolved: sql<number>`COALESCE(SUM(${dailyActivity.solvedCount}), 0)`.as("totalSolved"),
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(dailyActivity)
    .innerJoin(teamMembers, eq(teamMembers.userId, dailyActivity.userId))
    .innerJoin(users, eq(users.id, dailyActivity.userId))
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.status, "ACTIVE"),
        gte(dailyActivity.date, weekStartStr),
        lte(dailyActivity.date, weekEndStr)
      )
    )
    .groupBy(dailyActivity.userId, users.username, users.displayName, users.avatarUrl)
    .orderBy(desc(sql<number>`SUM(${dailyActivity.solvedCount})`), asc(users.username));

  return results.map((entry, index) => ({
    userId: entry.userId,
    username: entry.username,
    displayName: entry.displayName,
    avatarUrl: entry.avatarUrl,
    totalSolved: entry.totalSolved,
    rank: index + 1,
  }));
}

/**
 * Get all-time team stats.
 */
export async function getTeamAllTimeStats(teamId: string) {
  const results = await db
    .select({
      userId: teamMembers.userId,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      totalSolved: sql<number>`(
        SELECT COALESCE(SUM(${dailyActivity.solvedCount}), 0)
        FROM ${dailyActivity}
        WHERE ${dailyActivity.userId} = ${teamMembers.userId}
      )`.as("totalSolved"),
    })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId))
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.status, "ACTIVE")))
    .orderBy(desc(sql<number>`(
      SELECT COALESCE(SUM(${dailyActivity.solvedCount}), 0)
      FROM ${dailyActivity}
      WHERE ${dailyActivity.userId} = ${teamMembers.userId}
    )`));

  return results.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}