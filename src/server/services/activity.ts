/**
 * src/server/services/activity.ts
 * Server-side queries for fetching daily activity data.
 */
import { db } from "@/server/db";
import { dailyActivity, submissions, platformAccounts } from "@/server/db/schema";
import { eq, and, gte, lte, inArray, sql, desc } from "drizzle-orm";

// Type for submission with relations
interface SubmissionWithRelations {
  id: string;
  platformAccountId: string;
  problemId: string | null;
  externalSubmissionId: string;
  verdict: string;
  language: string | null;
  submittedAt: Date;
  isContest: boolean;
  contestId: string | null;
  problem: {
    id: string;
    platform: string;
    externalId: string;
    title: string;
    url: string | null;
    rating: number | null;
    tags: string[];
  } | null;
  platformAccount: {
    id: string;
    platform: string;
    handle: string;
  };
}

/**
 * Get daily activity for a specific user and date.
 * Returns solved count, submissions count, and contest count.
 */
export async function getDailyActivity(userId: string, date: string) {
  const activity = await db.query.dailyActivity.findFirst({
    where: and(
      eq(dailyActivity.userId, userId),
      eq(dailyActivity.date, date)
    ),
  });

  return activity ?? {
    userId,
    date,
    solvedCount: 0,
    submissionsCount: 0,
    contestsCount: 0,
    points: 0,
  };
}

/**
 * Get daily activity for a date range (inclusive).
 * Returns array of daily activity records.
 */
export async function getDailyActivityRange(
  userId: string,
  startDate: string,
  endDate: string
) {
  return db.query.dailyActivity.findMany({
    where: and(
      eq(dailyActivity.userId, userId),
      gte(dailyActivity.date, startDate),
      lte(dailyActivity.date, endDate)
    ),
    orderBy: [dailyActivity.date],
  });
}

/**
 * Get heatmap data for the last 365 days.
 * Returns array of { date, count } for each day.
 */
export async function getHeatmapData(userId: string): Promise<
  Array<{ date: string; count: number }>
> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 364); // 365 days including today

  const startStr = startDate.toISOString().split("T")[0]!;
  const endStr = endDate.toISOString().split("T")[0]!;

  const activities = await getDailyActivityRange(userId, startStr, endStr);

  // Create a map for quick lookup
  const activityMap = new Map(
    activities.map((a) => [a.date, a.solvedCount])
  );

  // Fill in all 365 days
  const result: Array<{ date: string; count: number }> = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0]!;
    result.push({
      date: dateStr,
      count: activityMap.get(dateStr) ?? 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

/**
 * Calculate current streak for a user.
 * Returns the number of consecutive days with at least one solve.
 */
export async function getStreak(userId: string): Promise<number> {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]!;

  // Get last 365 days of activity
  const heatmapData = await getHeatmapData(userId);

  // Start from today and count backwards
  let streak = 0;
  let currentDate = todayStr;

  // Check if there's activity today
  const todayActivity = heatmapData.find((d) => d.date === todayStr);
  if (!todayActivity || todayActivity.count === 0) {
    // Check yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    currentDate = yesterday.toISOString().split("T")[0]!;
  }

  // Count consecutive days with activity
  for (const day of heatmapData.reverse()) {
    if (day.date > currentDate) continue;
    if (day.count > 0) {
      streak++;
      // Move to previous day
      const prev = new Date(day.date);
      prev.setDate(prev.getDate() - 1);
      currentDate = prev.toISOString().split("T")[0]!;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get activity timeline for a specific date.
 * Returns submissions and contest participations for that day.
 */
export async function getActivityTimeline(userId: string, date: string) {
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  // Get user's platform accounts
  const accounts = await db.query.platformAccounts.findMany({
    where: eq(platformAccounts.userId, userId),
    columns: { id: true, platform: true, handle: true },
  });

  if (accounts.length === 0) {
    return { solves: [], contests: [] };
  }

  const accountIds = accounts.map((a) => a.id);

  // Get all submissions for this day
  const daySubmissions = await db.query.submissions.findMany({
    where: and(
      inArray(submissions.platformAccountId, accountIds),
      gte(submissions.submittedAt, startOfDay),
      lte(submissions.submittedAt, endOfDay)
    ),
    with: {
      problem: true,
      platformAccount: {
        columns: { platform: true, handle: true },
      },
    },
    orderBy: [desc(submissions.submittedAt)],
  }) as SubmissionWithRelations[];

  // Separate solves (accepted) and contest participations
  const solves = daySubmissions
    .filter((s) => s.verdict === "OK")
    .map((s) => ({
      id: s.id,
      platform: s.platformAccount.platform,
      handle: s.platformAccount.handle,
      problem: {
        externalId: s.problem?.externalId ?? "",
        title: s.problem?.title ?? "Unknown Problem",
        url: s.problem?.url,
        rating: s.problem?.rating,
        tags: s.problem?.tags ?? [],
      },
      language: s.language,
      submittedAt: s.submittedAt,
      isContest: s.isContest,
      contestId: s.contestId,
    }));

  // Get unique contest participations
  const contestSubs = daySubmissions.filter((s) => s.isContest && s.contestId);
  const uniqueContests = new Map();
  for (const s of contestSubs) {
    if (!uniqueContests.has(s.contestId)) {
      uniqueContests.set(s.contestId, {
        contestId: s.contestId,
        platform: s.platformAccount.platform,
        handle: s.platformAccount.handle,
        submittedAt: s.submittedAt,
        problemCount: 0,
      });
    }
    uniqueContests.get(s.contestId).problemCount++;
  }

  const contests = Array.from(uniqueContests.values()).map((c) => ({
    ...c,
    // Fetch contest details from contests table if needed
  }));

  return { solves, contests };
}

/**
 * Get platform breakdown stats for a user (total solves per platform).
 */
export async function getPlatformStats(userId: string) {
  const accounts = await db.query.platformAccounts.findMany({
    where: eq(platformAccounts.userId, userId),
    columns: { id: true, platform: true, handle: true, currentRating: true, maxRating: true, rank: true },
  });

  if (accounts.length === 0) return [];

  const accountIds = accounts.map((a) => a.id);

  // Get accepted submissions count per platform
  const stats = await db
    .select({
      platform: platformAccounts.platform,
      handle: platformAccounts.handle,
      currentRating: platformAccounts.currentRating,
      maxRating: platformAccounts.maxRating,
      rank: platformAccounts.rank,
      solvedCount: sql<number>`COUNT(DISTINCT ${submissions.problemId})`,
    })
    .from(submissions)
    .innerJoin(platformAccounts, eq(submissions.platformAccountId, platformAccounts.id))
    .where(
      and(
        inArray(submissions.platformAccountId, accountIds),
        eq(submissions.verdict, "OK")
      )
    )
    .groupBy(
      platformAccounts.id,
      platformAccounts.platform,
      platformAccounts.handle,
      platformAccounts.currentRating,
      platformAccounts.maxRating,
      platformAccounts.rank
    );

  return stats;
}