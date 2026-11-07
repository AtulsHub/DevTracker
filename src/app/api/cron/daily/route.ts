/**
 * Vercel Hobby-safe daily cron — runs all maintenance once per day.
 * Individual /api/cron/* routes remain for Pro / manual triggers.
 */
import { NextResponse } from "next/server";
import { env } from "@/env";
import { db } from "@/server/db";
import { platformAccounts, syncRuns } from "@/server/db/schema";
import { lt, and, ne, or, isNull, sql } from "drizzle-orm";
import { syncAccount } from "@/server/services/sync";
import { refreshContestsFromAdapters } from "@/server/services/contests";
import { recalculateAllActiveTargets } from "@/server/services/targets";
import { dispatchContestReminders } from "@/server/services/contest-reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // 1) Sync stale / never-synced accounts (batch for daily budget)
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const accounts = await db.query.platformAccounts.findMany({
      where: and(
        ne(platformAccounts.syncStatus, "pending"),
        or(
          isNull(platformAccounts.lastSyncedAt),
          lt(platformAccounts.lastSyncedAt, dayAgo),
        ),
      ),
      columns: { id: true, platform: true, handle: true },
      orderBy: [sql`${platformAccounts.lastSyncedAt} ASC NULLS FIRST`],
      limit: 15,
    });

    let synced = 0;
    const syncErrors: string[] = [];
    for (const account of accounts) {
      try {
        await syncAccount(account.id);
        synced++;
      } catch (err: unknown) {
        syncErrors.push(
          `${account.platform}/${account.handle}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    results.sync = {
      found: accounts.length,
      synced,
      errors: syncErrors.length ? syncErrors : undefined,
    };
  } catch (err: unknown) {
    results.sync = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 2) Contests
  try {
    const contests = await refreshContestsFromAdapters();
    results.contests = {
      upserted: contests.upserted,
      sources: contests.sources,
      errors: contests.errors.length ? contests.errors : undefined,
    };
  } catch (err: unknown) {
    results.contests = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 3) Target progress
  try {
    results.targets = {
      recalculated: await recalculateAllActiveTargets(),
    };
  } catch (err: unknown) {
    results.targets = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 4) In-app contest reminders
  try {
    results.reminders = await dispatchContestReminders();
  } catch (err: unknown) {
    results.reminders = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 5) Cleanup old sync runs
  try {
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const deleted = await db
      .delete(syncRuns)
      .where(lt(syncRuns.startedAt, cutoff))
      .returning({ id: syncRuns.id });
    results.cleanup = { deleted: deleted.length };
  } catch (err: unknown) {
    results.cleanup = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json({
    ok: true,
    results,
    timestamp: new Date().toISOString(),
  });
}
