/**
 * Vercel Cron: daily — purge old sync_runs (keep 14 days).
 */
import { NextResponse } from "next/server";
import { env } from "@/env";
import { db } from "@/server/db";
import { syncRuns } from "@/server/db/schema";
import { lt } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const deleted = await db
      .delete(syncRuns)
      .where(lt(syncRuns.startedAt, cutoff))
      .returning({ id: syncRuns.id });

    return NextResponse.json({
      ok: true,
      deleted: deleted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("[cron/cleanup] Error:", err);
    return NextResponse.json(
      {
        error: "Cleanup failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
