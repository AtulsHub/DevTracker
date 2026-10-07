/**
 * src/server/services/targets.ts
 * Targets engine for goal tracking.
 */
import { db } from "@/server/db";
import { targets, targetProgress, solves, platformAccounts, problems } from "@/server/db/schema";
import { eq, and, gte, desc, sql, inArray } from "drizzle-orm";

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
    isCompleted: boolean;
    lastUpdatedAt: Date;
  } | null;
}

/**
 * Get user's targets.
 */
export async function getUserTargets(userId: string) {
  const userTargets = await db.query.targets.findMany({
    where: eq(targets.createdBy, userId),
    orderBy: [desc(targets.createdAt)],
  });

  const result: TargetWithProgress[] = [];
  for (const target of userTargets) {
    const progress = await db.query.targetProgress.findFirst({
      where: eq(targetProgress.targetId, target.id),
    });

    result.push({
      ...target,
      progress: progress
        ? {
            currentValue: progress.currentValue,
            isCompleted: progress.status === "completed",
            lastUpdatedAt: progress.updatedAt,
          }
        : null,
    });
  }

  return result;
}

/**
 * Create a new target.
 */
export async function createTarget(data: {
  userId: string;
  title: string;
  type: "SOLVE_COUNT" | "SPECIFIC_PROBLEMS" | "CONTEST_PARTICIPATION" | "RATING_GOAL" | "STREAK" | "CUSTOM_CHECKLIST";
  criteria?: Record<string, unknown>;
  goalValue: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  teamId?: string | null;
}) {
  const [target] = await db
    .insert(targets)
    .values({
      title: data.title,
      type: data.type,
      criteria: data.criteria || {},
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      createdBy: data.userId,
      teamId: data.teamId,
    })
    .returning();

  // Initialize progress for creator
  await db.insert(targetProgress).values({
    targetId: target.id,
    userId: data.userId,
    currentValue: 0,
    goalValue: data.goalValue,
    status: "active",
  });

  return target;
}

/**
 * Recalculate target progress.
 */
export async function recalculateTarget(targetId: string) {
  const target = await db.query.targets.findFirst({
    where: eq(targets.id, targetId),
  });

  if (!target) return;

  let currentValue = 0;

  if (target.type === "SOLVE_COUNT") {
    const criteria = (target.criteria as Record<string, unknown>) || {};

    // Base query for solves in time range
    const baseConditions = [
      eq(solves.userId, target.createdBy),
    ];

    const whereConditions = [eq(solves.userId, target.createdBy)];
    if (target.startsAt) {
      whereConditions.push(gte(solves.firstSolvedAt, target.startsAt));
    }
    if (target.endsAt) {
      whereConditions.push(sql`${solves.firstSolvedAt} <= ${target.endsAt}`);
    }

    const solvesQuery = db
      .select({ count: sql<number>`COUNT(*)`.as("count") })
      .from(solves)
      .where(and(...whereConditions));

    // For now, simple count
    const result = await solvesQuery;
    currentValue = result[0]?.count ?? 0;
  }

  const isCompleted = currentValue >= 0; // Simplified for now

  await db
    .update(targetProgress)
    .set({
      currentValue,
      status: isCompleted ? "completed" : "active",
      completedAt: isCompleted ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(targetProgress.targetId, target.id));

}