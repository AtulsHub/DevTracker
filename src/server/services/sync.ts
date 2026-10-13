/**
 * src/server/services/sync.ts
 * Core logic for synchronizing platform submissions into the DevTrack database.
 */
import { db } from "@/server/db";
import {
  platformAccounts,
  syncRuns,
  problems,
  submissions,
  dailyActivity,
  platformEnum,
  solves,
} from "@/server/db/schema";
import { getAdapter } from "@/server/platforms";
import { eq, sql } from "drizzle-orm";
import type { NormalizedSubmission } from "@/server/platforms/types";

/**
 * Synchronize a specific platform account's data.
 * Fetches new submissions, upserts problems/submissions, and aggregates daily stats.
 */
export async function syncAccount(
  platformAccountId: string,
  options?: { full?: boolean },
) {
  const account = await db.query.platformAccounts.findFirst({
    where: eq(platformAccounts.id, platformAccountId),
  });

  if (!account) throw new Error("Platform account not found");

  const adapter = getAdapter(account.platform);
  if (!adapter) throw new Error(`Adapter for ${account.platform} not found`);

  // Record sync start
  const [syncRun] = await db
    .insert(syncRuns)
    .values({
      platformAccountId: account.id,
      startedAt: new Date(),
      status: "running",
      itemsFetched: 0,
    })
    .returning();

  try {
    // Full backfill on first sync or when explicitly requested
    const since =
      options?.full || !account.lastSyncedAt
        ? new Date(0)
        : new Date(
            Math.max(0, account.lastSyncedAt.getTime() - 24 * 60 * 60 * 1000),
          );

    const newSubmissions = await adapter.fetchSubmissions(account.handle, since);

    if (newSubmissions.length > 0) {
      await processSubmissions(account.id, account.userId, account.platform, newSubmissions);
    }

    // 2. Fetch and update profile metadata (rating, etc.)
    const profile = await adapter.fetchProfile(account.handle);

    // 3. Mark success
    await db
      .update(platformAccounts)
      .set({
        syncStatus: "success",
        lastSyncedAt: new Date(),
        currentRating: profile.currentRating,
        maxRating: profile.maxRating,
        rank: profile.rank,
      })
      .where(eq(platformAccounts.id, account.id));

    await db
      .update(syncRuns)
      .set({
        status: "success",
        itemsFetched: newSubmissions.length,
        finishedAt: new Date(),
      })
      .where(eq(syncRuns.id, syncRun.id));

    return { processed: newSubmissions.length, status: "success" };
  } catch (err: unknown) {
    console.error(`[Sync failed] Account ${account.id}:`, err);

    await db
      .update(platformAccounts)
      .set({ syncStatus: "degraded", syncError: err instanceof Error ? err.message : String(err) })
      .where(eq(platformAccounts.id, account.id));

    await db
      .update(syncRuns)
      .set({
        status: "error",
        error: err instanceof Error ? err.message : String(err),
        finishedAt: new Date(),
      })
      .where(eq(syncRuns.id, syncRun.id));

    throw err;
  }
}

/**
 * Upsert problems and submissions, then trigger daily activity rollup.
 */
async function processSubmissions(
  platformAccountId: string,
  userId: string,
  platform: string,
  newSubmissions: NormalizedSubmission[]
) {
  // Extract unique problems to upsert
  const uniqueProblems = new Map<string, NormalizedSubmission["problem"]>();
  for (const sub of newSubmissions) {
    uniqueProblems.set(sub.problem.externalId, sub.problem);
  }

  // 1. Upsert problems
  if (uniqueProblems.size > 0) {
    const problemsToInsert = Array.from(uniqueProblems.values()).map((p) => ({
      platform: platform as (typeof platformEnum.enumValues)[number],
      externalId: p.externalId,
      title: p.title,
      url: p.url,
      rating: p.rating,
      tags: p.tags,
    }));

    await db
      .insert(problems)
      .values(problemsToInsert)
      .onConflictDoUpdate({
        target: [problems.platform, problems.externalId],
        set: {
          title: sql`EXCLUDED.title`,
          rating: sql`EXCLUDED.rating`,
          tags: sql`EXCLUDED.tags`,
        },
      });
  }

  // We need the internal problem IDs to insert submissions.
  const externalIds = Array.from(uniqueProblems.keys());
  const dbProblems = await db.query.problems.findMany({
    where: (problems, { and, eq, inArray }) =>
      and(eq(problems.platform, platform as (typeof platformEnum.enumValues)[number]), inArray(problems.externalId, externalIds)),
    columns: { id: true, externalId: true },
  });

  const problemIdMap = new Map(dbProblems.map((p) => [p.externalId, p.id]));

  // 2. Upsert submissions
  const submissionsToInsert = newSubmissions.map((sub) => ({
    platformAccountId,
    problemId: problemIdMap.get(sub.problem.externalId)!,
    externalSubmissionId: sub.externalSubmissionId,
    verdict: sub.verdict,
    language: sub.language,
    submittedAt: sub.submittedAt,
    isContest: sub.isContest,
    contestId: sub.contestId,
  }));

  // We insert in batches of 100 to avoid query size limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < submissionsToInsert.length; i += BATCH_SIZE) {
    const batch = submissionsToInsert.slice(i, i + BATCH_SIZE);
    await db
      .insert(submissions)
      .values(batch)
      .onConflictDoNothing({
        target: [submissions.platformAccountId, submissions.externalSubmissionId],
      });
  }

  // 2b. Record first-solve rows (one per user+problem) for accepted submissions.
  const acceptedSubs = newSubmissions
    .filter((s) => s.verdict === "OK")
    .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
  if (acceptedSubs.length > 0) {
    const seen = new Set<string>();
    const solveRows: Array<{
      userId: string;
      problemId: string;
      firstSolvedAt: Date;
      solvedInContest: boolean;
    }> = [];
    for (const s of acceptedSubs) {
      const problemId = problemIdMap.get(s.problem.externalId);
      if (!problemId || seen.has(problemId)) continue;
      seen.add(problemId);
      solveRows.push({
        userId,
        problemId,
        firstSolvedAt: s.submittedAt,
        solvedInContest: s.isContest,
      });
    }
    if (solveRows.length > 0) {
      await db
        .insert(solves)
        .values(solveRows)
        .onConflictDoNothing({ target: [solves.userId, solves.problemId] });
    }
  }

  // 3. Calculate affected dates for daily_activity rollup
  const datesToUpdate = new Set<string>();
  for (const sub of newSubmissions) {
    const dateStr = sub.submittedAt.toISOString().split("T")[0]; // YYYY-MM-DD
    datesToUpdate.add(dateStr!);
  }

  // 4. Rollup daily activity
  for (const dateStr of datesToUpdate) {
    await rollupDailyActivity(userId, dateStr);
  }
}

/**
 * Aggregate stats for a specific user and date, and upsert into daily_activity.
 */
async function rollupDailyActivity(userId: string, dateStr: string) {
  // We query all submissions for this user on this day across all linked accounts
  // Note: we consider only first accepted submissions to count as "solved", but for simplicity
  // here we just count accepted submissions on this day. (A full implementation might check if it was solved previously).
  
  // Date boundaries
  const startOfDay = new Date(`${dateStr}T00:00:00Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  // Get user's accounts
  const accounts = await db.query.platformAccounts.findMany({
    where: eq(platformAccounts.userId, userId),
    columns: { id: true },
  });
  
  if (accounts.length === 0) return;
  const accountIds = accounts.map(a => a.id);

  // Find all accepted submissions on this day
  const acceptedSubs = await db.query.submissions.findMany({
    where: (subs, { and, eq, gte, lte, inArray }) =>
      and(
        inArray(subs.platformAccountId, accountIds),
        eq(subs.verdict, "OK"),
        gte(subs.submittedAt, startOfDay),
        lte(subs.submittedAt, endOfDay)
      ),
    columns: { problemId: true },
  });

  // Deduplicate by problemId (so solving the same problem twice on the same day counts once)
  const uniqueProblemIds = new Set(acceptedSubs.map((s) => s.problemId));
  const solvedCount = uniqueProblemIds.size;

  // Find if they participated in any contests
  const contestSubs = await db.query.submissions.findMany({
    where: (subs, { and, eq, gte, lte, inArray }) =>
      and(
        inArray(subs.platformAccountId, accountIds),
        eq(subs.isContest, true),
        gte(subs.submittedAt, startOfDay),
        lte(subs.submittedAt, endOfDay)
      ),
    columns: { contestId: true },
  });
  
  // Deduplicate contests
  const uniqueContests = new Set(
    contestSubs.map((s) => s.contestId).filter(Boolean)
  );
  const contestsCount = uniqueContests.size;

  if (solvedCount === 0 && contestsCount === 0) {
    // Nothing to rollup
    return;
  }

  // Upsert daily_activity
  await db
    .insert(dailyActivity)
    .values({
      userId,
      date: dateStr,
      solvedCount,
      contestsCount,
    })
    .onConflictDoUpdate({
      target: [dailyActivity.userId, dailyActivity.date],
      set: {
        solvedCount,
        contestsCount,
      },
    });
}
