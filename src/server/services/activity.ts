/**
 * Server-side queries for daily activity, heatmap, streak, timeline, platform stats.
 */
import { db } from "@/server/db";
import {
  dailyActivity,
  submissions,
  platformAccounts,
  solves,
  problems,
} from "@/server/db/schema";
import { eq, and, gte, lte, inArray, sql, desc, count } from "drizzle-orm";
import { todayLocalDateStr, toLocalDateStr } from "@/lib/date";

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

export async function getDailyActivity(userId: string, date: string) {
  const activity = await db.query.dailyActivity.findFirst({
    where: and(
      eq(dailyActivity.userId, userId),
      eq(dailyActivity.date, date),
    ),
  });

  return (
    activity ?? {
      userId,
      date,
      solvedCount: 0,
      submissionsCount: 0,
      contestsCount: 0,
      points: 0,
    }
  );
}

export async function getDailyActivityRange(
  userId: string,
  startDate: string,
  endDate: string,
) {
  return db.query.dailyActivity.findMany({
    where: and(
      eq(dailyActivity.userId, userId),
      gte(dailyActivity.date, startDate),
      lte(dailyActivity.date, endDate),
    ),
    orderBy: [dailyActivity.date],
  });
}

export async function getHeatmapData(userId: string): Promise<
  Array<{ date: string; count: number }>
> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 364);

  const startStr = toLocalDateStr(startDate);
  const endStr = toLocalDateStr(endDate);

  const activities = await getDailyActivityRange(userId, startStr, endStr);
  const activityMap = new Map(
    activities.map((a) => [a.date, a.solvedCount]),
  );

  const result: Array<{ date: string; count: number }> = [];
  const current = new Date(startDate);
  current.setHours(12, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(12, 0, 0, 0);
  while (current <= end) {
    const dateStr = toLocalDateStr(current);
    result.push({
      date: dateStr,
      count: activityMap.get(dateStr) ?? 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export async function getStreak(userId: string): Promise<number> {
  const todayStr = todayLocalDateStr();
  const heatmapData = await getHeatmapData(userId);

  let streak = 0;
  let currentDate = todayStr;

  const todayActivity = heatmapData.find((d) => d.date === todayStr);
  if (!todayActivity || todayActivity.count === 0) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    currentDate = toLocalDateStr(yesterday);
  }

  for (const day of [...heatmapData].reverse()) {
    if (day.date > currentDate) continue;
    if (day.count > 0) {
      streak++;
      const prev = new Date(day.date);
      prev.setDate(prev.getDate() - 1);
      currentDate = prev.toISOString().split("T")[0]!;
    } else if (day.date === currentDate) {
      break;
    }
  }

  return streak;
}

export async function getActivityTimeline(userId: string, date: string) {
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const accounts = await db.query.platformAccounts.findMany({
    where: eq(platformAccounts.userId, userId),
    columns: { id: true, platform: true, handle: true },
  });

  if (accounts.length === 0) {
    return { solves: [], contests: [] };
  }

  const accountIds = accounts.map((a) => a.id);

  const daySubmissions = (await db.query.submissions.findMany({
    where: and(
      inArray(submissions.platformAccountId, accountIds),
      gte(submissions.submittedAt, startOfDay),
      lte(submissions.submittedAt, endOfDay),
    ),
    with: {
      problem: true,
      platformAccount: {
        columns: { platform: true, handle: true },
      },
    },
    orderBy: [desc(submissions.submittedAt)],
  })) as SubmissionWithRelations[];

  const solvesList = daySubmissions
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

  const contestSubs = daySubmissions.filter((s) => s.isContest && s.contestId);
  const uniqueContests = new Map<
    string,
    {
      contestId: string;
      platform: string;
      handle: string;
      submittedAt: Date;
      problemCount: number;
    }
  >();
  for (const s of contestSubs) {
    const key = s.contestId!;
    if (!uniqueContests.has(key)) {
      uniqueContests.set(key, {
        contestId: key,
        platform: s.platformAccount.platform,
        handle: s.platformAccount.handle,
        submittedAt: s.submittedAt,
        problemCount: 0,
      });
    }
    uniqueContests.get(key)!.problemCount++;
  }

  return {
    solves: solvesList,
    contests: Array.from(uniqueContests.values()),
  };
}

/**
 * All linked platforms for a user, with solved counts (0 if none synced yet).
 */
export async function getPlatformStats(userId: string) {
  const accounts = await db.query.platformAccounts.findMany({
    where: eq(platformAccounts.userId, userId),
    columns: {
      id: true,
      platform: true,
      handle: true,
      currentRating: true,
      maxRating: true,
      rank: true,
      syncStatus: true,
      lastSyncedAt: true,
      syncError: true,
    },
  });

  if (accounts.length === 0) return [];

  const accountIds = accounts.map((a) => a.id);

  const counts = await db
    .select({
      platformAccountId: submissions.platformAccountId,
      solvedCount: sql<number>`COUNT(DISTINCT ${submissions.problemId})::int`,
    })
    .from(submissions)
    .where(
      and(
        inArray(submissions.platformAccountId, accountIds),
        eq(submissions.verdict, "OK"),
      ),
    )
    .groupBy(submissions.platformAccountId);

  const countMap = new Map(
    counts.map((c) => [c.platformAccountId, Number(c.solvedCount)]),
  );

  // Prefer solves table totals when available (cross-check)
  const solveTotals = await db
    .select({ total: count() })
    .from(solves)
    .where(eq(solves.userId, userId));

  void solveTotals;

  return accounts.map((a) => ({
    id: a.id,
    platform: a.platform,
    handle: a.handle,
    currentRating: a.currentRating,
    maxRating: a.maxRating,
    rank: a.rank,
    solvedCount: countMap.get(a.id) ?? 0,
    syncStatus: a.syncStatus,
    lastSyncedAt: a.lastSyncedAt,
    syncError: a.syncError,
  }));
}

/** Recent accepted solves across all platforms (for dashboard feed). */
export async function getRecentSolves(userId: string, limit = 15) {
  const accounts = await db.query.platformAccounts.findMany({
    where: eq(platformAccounts.userId, userId),
    columns: { id: true, platform: true, handle: true },
  });
  if (accounts.length === 0) return [];

  const accountIds = accounts.map((a) => a.id);
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const rows = await db
    .select({
      id: submissions.id,
      platformAccountId: submissions.platformAccountId,
      submittedAt: submissions.submittedAt,
      language: submissions.language,
      problemTitle: problems.title,
      problemUrl: problems.url,
      problemRating: problems.rating,
      problemExternalId: problems.externalId,
      platform: problems.platform,
    })
    .from(submissions)
    .innerJoin(problems, eq(submissions.problemId, problems.id))
    .where(
      and(
        inArray(submissions.platformAccountId, accountIds),
        eq(submissions.verdict, "OK"),
      ),
    )
    .orderBy(desc(submissions.submittedAt))
    .limit(limit);

  return rows.map((r) => {
    const acc = accountMap.get(r.platformAccountId);
    return {
      id: r.id,
      platform: r.platform,
      handle: acc?.handle ?? "",
      title: r.problemTitle,
      url: r.problemUrl,
      rating: r.problemRating,
      externalId: r.problemExternalId,
      language: r.language,
      submittedAt: r.submittedAt,
    };
  });
}

export async function getTotalSolved(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(solves)
    .where(eq(solves.userId, userId));
  return Number(row?.total ?? 0);
}
