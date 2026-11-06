/**
 * Targets engine — progress computed from synced solves.
 */
import { db } from "@/server/db";
import {
  targets,
  targetProgress,
  targetAssignees,
  solves,
  problems,
  platformEnum,
  users,
  dailyActivity,
  platformAccounts,
  contestResults,
} from "@/server/db/schema";
import { eq, and, gte, lte, desc, sql, inArray, or } from "drizzle-orm";
import { formatISO, eachDayOfInterval, subDays } from "date-fns";

type Platform = (typeof platformEnum.enumValues)[number];

export interface TargetMemberProgress {
  userId: string;
  username: string | null;
  displayName: string | null;
  currentValue: number;
  goalValue: number;
  isCompleted: boolean;
}

export interface TargetWithProgress {
  id: string;
  teamId: string | null;
  createdBy: string;
  title: string;
  description: string | null;
  type: string;
  criteria: Record<string, unknown>;
  startsAt: Date | null;
  endsAt: Date | null;
  recurrence: string;
  points: number;
  createdAt: Date;
  updatedAt: Date;
  progress: {
    currentValue: number;
    goalValue: number;
    isCompleted: boolean;
    lastUpdatedAt: Date;
  } | null;
  /** All assignees — used on team dashboards for leaders */
  memberProgress?: TargetMemberProgress[];
  completedCount?: number;
  assigneeCount?: number;
}

export async function getUserTargets(userId: string) {
  const userTargets = await db.query.targets.findMany({
    where: eq(targets.createdBy, userId),
    orderBy: [desc(targets.createdAt)],
  });

  const result: TargetWithProgress[] = [];
  for (const target of userTargets) {
    const progress = await db.query.targetProgress.findFirst({
      where: and(
        eq(targetProgress.targetId, target.id),
        eq(targetProgress.userId, userId),
      ),
    });

    result.push({
      ...target,
      progress: progress
        ? {
            currentValue: progress.currentValue,
            goalValue: progress.goalValue,
            isCompleted: progress.status === "completed",
            lastUpdatedAt: progress.updatedAt,
          }
        : null,
    });
  }

  return result;
}

export async function getTeamTargets(teamId: string, userId: string) {
  const teamTargets = await db.query.targets.findMany({
    where: eq(targets.teamId, teamId),
    orderBy: [desc(targets.createdAt)],
  });

  // Recalc in the background so the UI is not blocked on every page load
  void Promise.all(
    teamTargets.map((t) => recalculateTarget(t.id).catch(() => null)),
  );

  const result: TargetWithProgress[] = [];
  for (const target of teamTargets) {
    const rows = await db
      .select({
        userId: targetProgress.userId,
        currentValue: targetProgress.currentValue,
        goalValue: targetProgress.goalValue,
        status: targetProgress.status,
        updatedAt: targetProgress.updatedAt,
        username: users.username,
        displayName: users.displayName,
      })
      .from(targetProgress)
      .innerJoin(users, eq(users.id, targetProgress.userId))
      .where(eq(targetProgress.targetId, target.id));

    const mine = rows.find((r) => r.userId === userId);
    const memberProgress: TargetMemberProgress[] = rows.map((r) => ({
      userId: r.userId,
      username: r.username,
      displayName: r.displayName,
      currentValue: r.currentValue,
      goalValue: r.goalValue,
      isCompleted: r.status === "completed",
    }));

    result.push({
      ...target,
      progress: mine
        ? {
            currentValue: mine.currentValue,
            goalValue: mine.goalValue,
            isCompleted: mine.status === "completed",
            lastUpdatedAt: mine.updatedAt,
          }
        : null,
      memberProgress,
      completedCount: memberProgress.filter((m) => m.isCompleted).length,
      assigneeCount: memberProgress.length,
    });
  }

  return result;
}

export async function createTarget(data: {
  userId: string;
  title: string;
  description?: string | null;
  type:
    | "SOLVE_COUNT"
    | "SPECIFIC_PROBLEMS"
    | "CONTEST_PARTICIPATION"
    | "RATING_GOAL"
    | "STREAK"
    | "CUSTOM_CHECKLIST";
  criteria?: Record<string, unknown>;
  goalValue: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  teamId?: string | null;
  assigneeIds?: string[];
}) {
  const [target] = await db
    .insert(targets)
    .values({
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      criteria: data.criteria || {},
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      createdBy: data.userId,
      teamId: data.teamId,
    })
    .returning();

  const assignees =
    data.assigneeIds && data.assigneeIds.length > 0
      ? data.assigneeIds
      : [data.userId];

  if (data.assigneeIds && data.assigneeIds.length > 0) {
    await db.insert(targetAssignees).values(
      data.assigneeIds.map((uid) => ({
        targetId: target.id,
        userId: uid,
      })),
    );
  }

  await db.insert(targetProgress).values(
    assignees.map((uid) => ({
      targetId: target.id,
      userId: uid,
      currentValue: 0,
      goalValue: data.goalValue,
      status: "active" as const,
    })),
  );

  return target;
}

async function countSolvesForUser(
  userId: string,
  target: typeof targets.$inferSelect,
): Promise<number> {
  const criteria = (target.criteria as Record<string, unknown>) || {};
  const platform = typeof criteria.platform === "string" ? criteria.platform : null;
  const minRating =
    typeof criteria.minRating === "number" ? criteria.minRating : null;
  const maxRating =
    typeof criteria.maxRating === "number" ? criteria.maxRating : null;
  const urls = Array.isArray(criteria.problemUrls)
    ? criteria.problemUrls.filter((u): u is string => typeof u === "string")
    : [];
  const externalIds = Array.isArray(criteria.externalIds)
    ? criteria.externalIds.filter((u): u is string => typeof u === "string")
    : [];

  const conditions = [eq(solves.userId, userId)];
  if (target.startsAt) {
    conditions.push(gte(solves.firstSolvedAt, target.startsAt));
  }
  if (target.endsAt) {
    conditions.push(lte(solves.firstSolvedAt, target.endsAt));
  }

  const problemConditions = [];
  if (platform && (platformEnum.enumValues as string[]).includes(platform)) {
    problemConditions.push(eq(problems.platform, platform as Platform));
  }
  if (minRating != null) {
    problemConditions.push(gte(problems.rating, minRating));
  }
  if (maxRating != null) {
    problemConditions.push(lte(problems.rating, maxRating));
  }
  if (urls.length > 0 || externalIds.length > 0) {
    const parts = [];
    if (urls.length > 0) parts.push(inArray(problems.url, urls));
    if (externalIds.length > 0) {
      parts.push(inArray(problems.externalId, externalIds));
    }
    const match = parts.length === 1 ? parts[0]! : or(...parts);
    if (match) problemConditions.push(match);
  }

  if (problemConditions.length > 0) {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(solves)
      .innerJoin(problems, eq(solves.problemId, problems.id))
      .where(and(...conditions, ...problemConditions));

    return Number(rows[0]?.count ?? 0);
  }

  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(solves)
    .where(and(...conditions));

  return Number(rows[0]?.count ?? 0);
}

async function currentStreakDays(
  userId: string,
  target: typeof targets.$inferSelect,
): Promise<number> {
  const end = target.endsAt && target.endsAt < new Date() ? target.endsAt : new Date();
  const start = target.startsAt ?? subDays(end, 120);
  const startDate = formatISO(start, { representation: "date" });
  const endDate = formatISO(end, { representation: "date" });

  const rows = await db
    .select({
      date: dailyActivity.date,
      solvedCount: dailyActivity.solvedCount,
    })
    .from(dailyActivity)
    .where(
      and(
        eq(dailyActivity.userId, userId),
        gte(dailyActivity.date, startDate),
        lte(dailyActivity.date, endDate),
        sql`${dailyActivity.solvedCount} > 0`,
      ),
    );

  const active = new Set(rows.map((r) => r.date));
  let streak = 0;
  const days = eachDayOfInterval({ start, end }).reverse();
  for (const day of days) {
    const key = formatISO(day, { representation: "date" });
    if (active.has(key)) streak += 1;
    else if (streak > 0) break;
  }
  return streak;
}

async function contestCountForUser(
  userId: string,
  target: typeof targets.$inferSelect,
): Promise<number> {
  const criteria = (target.criteria as Record<string, unknown>) || {};
  const platform =
    typeof criteria.platform === "string" ? criteria.platform : null;

  const accountWhere =
    platform && (platformEnum.enumValues as string[]).includes(platform)
      ? and(
          eq(platformAccounts.userId, userId),
          eq(platformAccounts.platform, platform as Platform),
        )
      : eq(platformAccounts.userId, userId);

  const accounts = await db.query.platformAccounts.findMany({
    where: accountWhere,
    columns: { id: true },
  });
  if (accounts.length === 0) return 0;

  const conditions = [
    inArray(
      contestResults.platformAccountId,
      accounts.map((a) => a.id),
    ),
  ];
  if (target.startsAt) {
    conditions.push(gte(contestResults.participatedAt, target.startsAt));
  }
  if (target.endsAt) {
    conditions.push(lte(contestResults.participatedAt, target.endsAt));
  }

  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contestResults)
    .where(and(...conditions));

  return Number(rows[0]?.count ?? 0);
}

async function ratingForUser(
  userId: string,
  target: typeof targets.$inferSelect,
): Promise<number> {
  const criteria = (target.criteria as Record<string, unknown>) || {};
  const platform =
    typeof criteria.platform === "string" ? criteria.platform : null;

  const accountWhere =
    platform && (platformEnum.enumValues as string[]).includes(platform)
      ? and(
          eq(platformAccounts.userId, userId),
          eq(platformAccounts.platform, platform as Platform),
        )
      : eq(platformAccounts.userId, userId);

  const accounts = await db.query.platformAccounts.findMany({
    where: accountWhere,
    columns: { currentRating: true, maxRating: true },
  });

  let best = 0;
  for (const a of accounts) {
    best = Math.max(best, a.currentRating ?? 0, a.maxRating ?? 0);
  }
  return best;
}

/**
 * Recalculate progress for every assignee of a target.
 */
export async function recalculateTarget(targetId: string) {
  const target = await db.query.targets.findFirst({
    where: eq(targets.id, targetId),
  });
  if (!target) return;

  const progressRows = await db.query.targetProgress.findMany({
    where: eq(targetProgress.targetId, targetId),
  });

  for (const row of progressRows) {
    let currentValue = row.currentValue;

    switch (target.type) {
      case "SOLVE_COUNT":
      case "SPECIFIC_PROBLEMS":
        currentValue = await countSolvesForUser(row.userId, target);
        break;
      case "STREAK":
        currentValue = await currentStreakDays(row.userId, target);
        break;
      case "CONTEST_PARTICIPATION":
        currentValue = await contestCountForUser(row.userId, target);
        break;
      case "RATING_GOAL":
        currentValue = await ratingForUser(row.userId, target);
        break;
      case "CUSTOM_CHECKLIST":
        // Manual / self-reported — keep existing currentValue.
        break;
      default:
        break;
    }

    const goalValue = row.goalValue;
    const isCompleted = currentValue >= goalValue;

    await db
      .update(targetProgress)
      .set({
        currentValue,
        status: isCompleted ? "completed" : "active",
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(targetProgress.targetId, targetId),
          eq(targetProgress.userId, row.userId),
        ),
      );
  }
}

export async function recalculateAllActiveTargets() {
  const active = await db
    .select({ id: targets.id })
    .from(targets)
    .innerJoin(targetProgress, eq(targetProgress.targetId, targets.id))
    .where(eq(targetProgress.status, "active"))
    .groupBy(targets.id)
    .limit(50);

  for (const t of active) {
    await recalculateTarget(t.id);
  }

  return active.length;
}
