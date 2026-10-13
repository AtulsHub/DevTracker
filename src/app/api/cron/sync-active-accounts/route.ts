/**
 * src/app/api/cron/sync-active-accounts/route.ts
 * Vercel Cron: runs every 15 minutes.
 * Triggers incremental sync for active platform accounts.
 * Protected by CRON_SECRET header.
 */
import { NextResponse } from "next/server";
import { env } from "@/env";
import { db } from "@/server/db";
import { platformAccounts } from "@/server/db/schema";
import { lt, and, ne, or, isNull, sql } from "drizzle-orm";
import { syncAccount } from "@/server/services/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro allows up to 300s

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (
    env.CRON_SECRET &&
    authHeader !== `Bearer ${env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Never-synced (null) OR older than 15 minutes; skip pure pending claims
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const accountsToSync = await db.query.platformAccounts.findMany({
      where: and(
        ne(platformAccounts.syncStatus, "pending"),
        or(
          isNull(platformAccounts.lastSyncedAt),
          lt(platformAccounts.lastSyncedAt, fifteenMinutesAgo),
        ),
      ),
      columns: { id: true, platform: true, handle: true },
      orderBy: [sql`${platformAccounts.lastSyncedAt} ASC NULLS FIRST`],
      limit: 10,
    });

    let syncedCount = 0;
    const errors: string[] = [];

    // Run sync sequentially to respect platform rate limits and DB connections
    for (const account of accountsToSync) {
      try {
        await syncAccount(account.id);
        syncedCount++;
      } catch (err: unknown) {
        errors.push(
          `Failed to sync ${account.handle} on ${account.platform}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return NextResponse.json({
      ok: true,
      found: accountsToSync.length,
      synced: syncedCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/sync-active-accounts] Error:", err);
    return NextResponse.json(
      { error: "Sync failed", details: String(err) },
      { status: 500 }
    );
  }
}
