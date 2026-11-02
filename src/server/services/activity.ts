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

function buildDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  current.setHours(12, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(12, 0, 0, 0);
  while (current <= end) {
    dates.push(toLocalDateStr(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function fillHeatmapSeries(
  dates: string[],
  counts: Map<string, number>,
): Array<{ date: string; count: number }> {
  return dates.map((date) => ({ date, count: counts.get(date) ?? 0 }));
}

export async function getHeatmapData(userId: string): Promise<
  Array<{ date: string; count: number }>
> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 364);

  const startStr = toLocalDateStr(startDate);
  const endStr = toLocalDateStr(endDate);
  const dates = buildDateRange(startDate, endDate);

  const activities = await getDailyActivityRange(userId, startStr, endStr);
  const activityMap = new Map(
    activities.map((a) => [a.date, a.solvedCount]),
  );

  return fillHeatmapSeries(dates, activityMap);
}

type HeatmapSeries = {
  all: Array<{ date: string; count: number }>;
  byPlatform: Record<string, Array<{ date: string; count: number }>>;
};

function bumpEarliest(earliest: Date | null, d: Date): Date {
  return !earliest || d < earliest ? d : earliest;
}

/**
 * Heatmap series for year + all-time, with per-platform breakdown.
 * Built once so the UI can filter without refetching.
 * Prefers daily_activity + cached platform calendars so truncated
 * submission APIs (LeetCode ~20 recent) do not empty the heatmap.
 */
export async function getHeatmapByPlatform(userId: string): Promise<{
  year: HeatmapSeries;
  allTime: HeatmapSeries;
  platforms: string[];
  activeYears: number[];
}> {
  const endDate = new Date();
  endDate.setHours(12, 0, 0, 0);

  const accounts = await db.query.platformAccounts.findMany({
    where: eq(platformAccounts.userId, userId),
    columns: { platform: true, activityCalendar: true },
  });
  const linkedPlatforms = [
    ...new Set(accounts.map((a) => a.platform as string)),
  ].sort();

  const platformCounts = new Map<string, Map<string, number>>();
  for (const p of linkedPlatforms) {
    platformCounts.set(p, new Map());
  }

  let earliest: Date | null = null;
  const platformsWithCalendar = new Set<string>();

  // 1) Platform calendar caches (full LeetCode history, etc.)
  for (const account of accounts) {
    const cal = account.activityCalendar;
    if (!cal || typeof cal !== "object") continue;
    if (!platformCounts.has(account.platform)) {
      platformCounts.set(account.platform, new Map());
    }
    const pMap = platformCounts.get(account.platform)!;
    let any = false;
    for (const [date, count] of Object.entries(cal)) {
      const n = Number(count) || 0;
      if (n <= 0) continue;
      any = true;
      pMap.set(date, Math.max(pMap.get(date) ?? 0, n));
      earliest = bumpEarliest(earliest, new Date(`${date}T12:00:00`));
    }
    if (any) platformsWithCalendar.add(account.platform);
  }

  // 2) First-solve rows for platforms without a full calendar cache
  const rows = await db
    .select({
      platform: problems.platform,
      firstSolvedAt: solves.firstSolvedAt,
    })
    .from(solves)
    .innerJoin(problems, eq(solves.problemId, problems.id))
    .where(eq(solves.userId, userId));

  for (const row of rows) {
    if (platformsWithCalendar.has(row.platform)) continue;
    const date = toLocalDateStr(row.firstSolvedAt);
    if (!platformCounts.has(row.platform)) {
      platformCounts.set(row.platform, new Map());
    }
    const map = platformCounts.get(row.platform)!;
    map.set(date, (map.get(date) ?? 0) + 1);
    earliest = bumpEarliest(earliest, new Date(row.firstSolvedAt));
  }

  // 3) "All" = sum of per-platform days, floored by daily_activity rollup
  const allCounts = new Map<string, number>();
  for (const map of platformCounts.values()) {
    for (const [date, count] of map) {
      allCounts.set(date, (allCounts.get(date) ?? 0) + count);
    }
  }

  const rollupAll = await db.query.dailyActivity.findMany({
    where: and(
      eq(dailyActivity.userId, userId),
      gte(dailyActivity.solvedCount, 1),
    ),
    columns: { date: true, solvedCount: true },
    orderBy: [dailyActivity.date],
  });
  for (const a of rollupAll) {
    allCounts.set(
      a.date,
      Math.max(allCounts.get(a.date) ?? 0, a.solvedCount),
    );
    earliest = bumpEarliest(earliest, new Date(`${a.date}T12:00:00`));
  }

  const yearStart = new Date(endDate);
  yearStart.setDate(yearStart.getDate() - 364);
  yearStart.setHours(12, 0, 0, 0);

  const allTimeStart = earliest ? new Date(earliest) : new Date(yearStart);
  allTimeStart.setHours(12, 0, 0, 0);

  const allTimeDates = buildDateRange(allTimeStart, endDate);
  const allTimeAll = fillHeatmapSeries(allTimeDates, allCounts);
  const allTimeByPlatform: Record<
    string,
    Array<{ date: string; count: number }>
  > = {};
  for (const [platform, map] of platformCounts) {
    allTimeByPlatform[platform] = fillHeatmapSeries(allTimeDates, map);
  }

  const allTimeSeries: HeatmapSeries = {
    all: allTimeAll,
    byPlatform: allTimeByPlatform,
  };

  // Past-year view always covers a full 365-day window (empty cells included),
  // like LeetCode — not truncated to the first activity day.
  const yearDates = buildDateRange(yearStart, endDate);
  const yearSeries: HeatmapSeries = {
    all: fillHeatmapSeries(yearDates, allCounts),
    byPlatform: Object.fromEntries(
      Object.entries(allTimeByPlatform).map(([platform, _days]) => {
        const map = platformCounts.get(platform) ?? new Map();
        return [platform, fillHeatmapSeries(yearDates, map)];
      }),
    ),
  };

  const activeYears = [
    ...new Set(
      [...allCounts.keys()]
        .filter((d) => (allCounts.get(d) ?? 0) > 0)
        .map((d) => Number(d.slice(0, 4))),
    ),
  ]
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => b - a);

  return {
    year: yearSeries,
    allTime: allTimeSeries,
    platforms: Object.keys(allTimeByPlatform).sort(),
    activeYears,
  };
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
      reportedSolvedCount: true,
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

  return accounts.map((a) => {
    const local = countMap.get(a.id) ?? 0;
    const reported = a.reportedSolvedCount ?? 0;
    // Prefer the higher of local synced problems vs platform-reported total
    // (LeetCode public API truncates history but submitStats is accurate).
    return {
      id: a.id,
      platform: a.platform,
      handle: a.handle,
      currentRating: a.currentRating,
      maxRating: a.maxRating,
      rank: a.rank,
      solvedCount: Math.max(local, reported),
      syncStatus: a.syncStatus,
      lastSyncedAt: a.lastSyncedAt,
      syncError: a.syncError,
    };
  });
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
  // Sum per-platform stats so LeetCode reported totals are included even when
  // public APIs only synced a truncated submission list.
  const stats = await getPlatformStats(userId);
  if (stats.length > 0) {
    return stats.reduce((sum, s) => sum + s.solvedCount, 0);
  }
  const [row] = await db
    .select({ total: count() })
    .from(solves)
    .where(eq(solves.userId, userId));
  return Number(row?.total ?? 0);
}
