/**
 * src/server/services/contests.ts
 * Business logic for contest management.
 */
import { db } from "@/server/db";
import { contests, platformEnum, contestPhaseEnum } from "@/server/db/schema";
import { eq, and, gte, lte, asc, sql } from "drizzle-orm";
import { listRegisteredPlatforms, tryGetAdapter } from "@/server/platforms";

export interface ContestFilters {
  platform?: string;
  startDate?: Date;
  endDate?: Date;
  phase?: string;
  limit?: number;
  offset?: number;
}

export interface NormalizedContest {
  id: string;
  platform: string;
  externalId: string;
  name: string;
  url?: string;
  startsAt: Date;
  durationSeconds?: number;
  type?: string;
  phase: string;
}

/**
 * Get contests with optional filters.
 */
export async function getContests(filters: ContestFilters = {}): Promise<NormalizedContest[]> {
  const {
    platform,
    startDate,
    endDate,
    phase,
    limit = 50,
    offset = 0,
  } = filters;

  const conditions = [];

  if (platform) {
    conditions.push(eq(contests.platform, platform as (typeof platformEnum.enumValues)[number]));
  }

  if (startDate) {
    conditions.push(gte(contests.startsAt, startDate));
  }

  if (endDate) {
    conditions.push(lte(contests.startsAt, endDate));
  }

  if (phase) {
    conditions.push(eq(contests.phase, phase as (typeof contestPhaseEnum.enumValues)[number]));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select()
    .from(contests)
    .where(whereClause)
    .orderBy(asc(contests.startsAt))
    .limit(limit)
    .offset(offset);

  return results.map((c) => ({
    id: c.id,
    platform: c.platform,
    externalId: c.externalId,
    name: c.name,
    url: c.url ?? undefined,
    startsAt: c.startsAt,
    durationSeconds: c.durationSeconds ?? undefined,
    type: c.type ?? undefined,
    phase: c.phase,
  }));
}

/**
 * Get upcoming contests (phase = BEFORE).
 */
export async function getUpcomingContests(
  platform?: string,
  days = 30,
) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return getContests({
    platform,
    startDate,
    endDate,
    phase: "BEFORE",
    limit: 100,
  });
}

/**
 * Get contest by ID.
 */
export async function getContestById(id: string): Promise<NormalizedContest | null> {
  const result = await db
    .select()
    .from(contests)
    .where(eq(contests.id, id))
    .limit(1);

  if (result.length === 0) return null;

  const c = result[0];
  return {
    id: c.id,
    platform: c.platform,
    externalId: c.externalId,
    name: c.name,
    url: c.url ?? undefined,
    startsAt: c.startsAt,
    durationSeconds: c.durationSeconds ?? undefined,
    type: c.type ?? undefined,
    phase: c.phase,
  };
}

/**
 * Get contests grouped by platform.
 */
export async function getContestsByPlatform(): Promise<Record<string, NormalizedContest[]>> {
  const allContests = await getContests({ limit: 200 });
  const grouped: Record<string, NormalizedContest[]> = {};

  for (const contest of allContests) {
    if (!grouped[contest.platform]) {
      grouped[contest.platform] = [];
    }
    grouped[contest.platform].push(contest);
  }

  return grouped;
}

/**
 * Upsert contests from platform adapter data.
 * Used by the refresh-contests cron job.
 */
export async function upsertContests(
  platform: string,
  contestData: Array<{
    externalId: string;
    name: string;
    url?: string;
    startsAt: Date;
    durationSeconds?: number;
    type?: string;
    phase: string;
  }>
): Promise<number> {
  let upserted = 0;

  for (const c of contestData) {
    const result = await db
      .insert(contests)
      .values({
        platform: platform as (typeof platformEnum.enumValues)[number],
        externalId: c.externalId,
        name: c.name,
        url: c.url,
        startsAt: c.startsAt,
        durationSeconds: c.durationSeconds,
        type: c.type,
        phase: c.phase as (typeof contestPhaseEnum.enumValues)[number],
      })
      .onConflictDoUpdate({
        target: [contests.platform, contests.externalId],
        set: {
          name: sql`EXCLUDED.name`,
          url: sql`EXCLUDED.url`,
          startsAt: sql`EXCLUDED.starts_at`,
          durationSeconds: sql`EXCLUDED.duration_seconds`,
          type: sql`EXCLUDED.type`,
          phase: sql`EXCLUDED.phase`,
          updatedAt: sql`NOW()`,
        },
      })
      .returning({ id: contests.id });

    if (result.length > 0) upserted++;
  }

  return upserted;
}

/**
 * Pull upcoming contests from every registered platform adapter and upsert.
 */
export async function refreshContestsFromAdapters(): Promise<{
  upserted: number;
  errors: string[];
}> {
  let upserted = 0;
  const errors: string[] = [];

  for (const platform of listRegisteredPlatforms()) {
    const adapter = tryGetAdapter(platform);
    if (!adapter) continue;
    try {
      const upcoming = await adapter.fetchUpcomingContests();
      if (upcoming.length > 0) {
        upserted += await upsertContests(platform, upcoming);
      }
    } catch (err: unknown) {
      errors.push(
        `${platform}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  await updateContestPhases();
  return { upserted, errors };
}

/**
 * Update phases of contests based on current time.
 * Run periodically to move contests from BEFORE → CODING → FINISHED.
 */
export async function updateContestPhases(): Promise<number> {
  const now = new Date();

  // BEFORE → CODING (contest started)
  const startedResult = await db
    .update(contests)
    .set({ phase: "CODING", updatedAt: now })
    .where(
      and(
        eq(contests.phase, "BEFORE"),
        lte(contests.startsAt, now)
      )
    );

  // CODING → FINISHED (contest ended)
  const finishedResult = await db
    .update(contests)
    .set({ phase: "FINISHED", updatedAt: now })
    .where(
      and(
        eq(contests.phase, "CODING"),
        lte(
          sql`${contests.startsAt} + ${contests.durationSeconds} * interval '1 second'`,
          now
        )
      )
    );

  return (startedResult.rowCount ?? 0) + (finishedResult.rowCount ?? 0);
}