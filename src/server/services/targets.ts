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
} from "@/server/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

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

  const conditions = [eq(solves.userId, userId)];
  if (target.startsAt) {
    conditions.push(gte(solves.firstSolvedAt, target.startsAt));
  }
  if (target.endsAt) {
    conditions.push(lte(solves.firstSolvedAt, target.endsAt));
  }

  if (platform || minRating != null || maxRating != null) {
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
    let currentValue = 0;

    if (target.type === "SOLVE_COUNT") {
      currentValue = await countSolvesForUser(row.userId, target);
    }
    // Other target types can be added in follow-up tasks.

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
