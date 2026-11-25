/**
 * Vercel Hobby-safe daily cron — runs all maintenance once per day.
 * Individual /api/cron/* routes remain for Pro / manual triggers.
 */
import { NextResponse } from "next/server";
import { env } from "@/env";
import { isAuthorizedCronRequest } from "@/server/auth/cron";
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
  if (!isAuthorizedCronRequest(req, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const failures: string[] = [];

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
    failures.push(...syncErrors.map((error) => `sync: ${error}`));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.sync = {
      error: message,
    };
    failures.push(`sync: ${message}`);
  }

  // 2) Contests
  try {
    const contests = await refreshContestsFromAdapters();
    results.contests = {
      upserted: contests.upserted,
      sources: contests.sources,
      errors: contests.errors.length ? contests.errors : undefined,
    };
    failures.push(...contests.errors.map((error) => `contests: ${error}`));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.contests = {
      error: message,
    };
    failures.push(`contests: ${message}`);
  }

  // 3) Target progress
  try {
    results.targets = {
      recalculated: await recalculateAllActiveTargets(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.targets = {
      error: message,
    };
    failures.push(`targets: ${message}`);
  }

  // 4) In-app contest reminders
  try {
    results.reminders = await dispatchContestReminders();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.reminders = {
      error: message,
    };
    failures.push(`reminders: ${message}`);
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
    const message = err instanceof Error ? err.message : String(err);
    results.cleanup = {
      error: message,
    };
    failures.push(`cleanup: ${message}`);
  }

  return NextResponse.json(
    {
      ok: failures.length === 0,
      results,
      errors: failures.length ? failures : undefined,
      timestamp: new Date().toISOString(),
    },
    { status: failures.length ? 500 : 200 },
  );
}
