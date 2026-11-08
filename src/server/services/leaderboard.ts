/**
 * Team leaderboard calculation from daily_activity rollups
 * (period ranges) and profile totals (all-time).
 */
import { db } from "@/server/db";
import { dailyActivity, teamMembers, users } from "@/server/db/schema";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfWeek,
  endOfMonth,
  formatISO,
  subDays,
} from "date-fns";
import { getTotalSolvedByUserIds } from "@/server/services/activity";

export type LeaderboardRange = "daily" | "weekly" | "monthly" | "all-time";

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalSolved: number;
  rank: number;
}

function rangeBounds(range: LeaderboardRange): { start: string; end: string } | null {
  const now = new Date();
  if (range === "all-time") return null;

  let start: Date;
  let end: Date = endOfDay(now);

  switch (range) {
    case "daily":
      start = startOfDay(now);
      break;
    case "weekly":
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "monthly":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    default:
      start = subDays(now, 7);
  }

  return {
    start: formatISO(start, { representation: "date" }),
    end: formatISO(end, { representation: "date" }),
  };
}

/**
 * Get team leaderboard for a range.
 * all-time uses the same profile totals as Explore / public profiles.
 */
export async function getTeamLeaderboard(
  teamId: string,
  range: LeaderboardRange = "weekly",
): Promise<LeaderboardEntry[]> {
  if (range === "all-time") {
    const members = await db
      .select({
        userId: teamMembers.userId,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(teamMembers)
      .innerJoin(users, eq(users.id, teamMembers.userId))
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.status, "ACTIVE")),
      );

    if (members.length === 0) return [];

    const totals = await getTotalSolvedByUserIds(members.map((m) => m.userId));
    return members
      .map((m) => ({
        userId: m.userId,
        username: m.username,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl,
        totalSolved: totals.get(m.userId) ?? 0,
        rank: 0,
      }))
      .sort((a, b) => {
        if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
        return a.username.localeCompare(b.username);
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  const bounds = rangeBounds(range);
  const conditions = [
    eq(teamMembers.teamId, teamId),
    eq(teamMembers.status, "ACTIVE"),
  ];

  if (bounds) {
    conditions.push(gte(dailyActivity.date, bounds.start));
    conditions.push(lte(dailyActivity.date, bounds.end));
  }

  const results = await db
    .select({
      userId: dailyActivity.userId,
      totalSolved: sql<number>`COALESCE(SUM(${dailyActivity.solvedCount}), 0)`.as(
        "totalSolved",
      ),
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(dailyActivity)
    .innerJoin(teamMembers, eq(teamMembers.userId, dailyActivity.userId))
    .innerJoin(users, eq(users.id, dailyActivity.userId))
    .where(and(...conditions))
    .groupBy(
      dailyActivity.userId,
      users.username,
      users.displayName,
      users.avatarUrl,
    )
    .orderBy(
      desc(sql<number>`SUM(${dailyActivity.solvedCount})`),
      asc(users.username),
    );

  return results.map((entry, index) => ({
    userId: entry.userId,
    username: entry.username,
    displayName: entry.displayName,
    avatarUrl: entry.avatarUrl,
    totalSolved: Number(entry.totalSolved),
    rank: index + 1,
  }));
}

/** @deprecated use getTeamLeaderboard(teamId, "weekly") */
export async function getTeamLeaderboardWeek(
  teamId: string,
  _weekOffset = 0,
): Promise<LeaderboardEntry[]> {
  return getTeamLeaderboard(teamId, "weekly");
}

export async function getTeamAllTimeStats(teamId: string) {
  return getTeamLeaderboard(teamId, "all-time");
}
