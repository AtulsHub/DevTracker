/**
 * POST /api/platforms/sync-all — sync every linked account for the current user.
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { platformAccounts } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { syncAccount } from "@/server/services/sync";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(
    `sync-all:${session.user.id}:${clientIp(req)}`,
    3,
    5 * 60_000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Please wait ${limited.retryAfterSec}s before syncing again` },
      { status: 429 },
    );
  }

  const accounts = await db.query.platformAccounts.findMany({
    where: eq(platformAccounts.userId, session.user.id),
    columns: { id: true, platform: true, handle: true, lastSyncedAt: true },
  });

  if (accounts.length === 0) {
    return NextResponse.json({
      ok: true,
      synced: 0,
      results: [],
      message: "No platforms linked yet",
    });
  }

  const results: Array<{
    platform: string;
    handle: string;
    ok: boolean;
    processed?: number;
    error?: string;
  }> = [];

  for (const account of accounts) {
    if (
      account.lastSyncedAt &&
      account.lastSyncedAt.getTime() > Date.now() - 5 * 60_000
    ) {
      results.push({
        platform: account.platform,
        handle: account.handle,
        ok: true,
        processed: 0,
        error: "skipped (cooldown)",
      });
      continue;
    }

    try {
      // Prefer full backfill when never synced or stale (>1 day) so dashboard fills
      const needsFull =
        !account.lastSyncedAt ||
        account.lastSyncedAt.getTime() < Date.now() - 24 * 60 * 60 * 1000;
      const r = await syncAccount(account.id, { full: needsFull });
      results.push({
        platform: account.platform,
        handle: account.handle,
        ok: true,
        processed: r.processed,
      });
    } catch (err: unknown) {
      results.push({
        platform: account.platform,
        handle: account.handle,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    synced: results.filter((r) => r.ok && r.error !== "skipped (cooldown)")
      .length,
    results,
  });
}
