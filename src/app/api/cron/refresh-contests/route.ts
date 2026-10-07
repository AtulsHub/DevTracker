/**
 * src/app/api/cron/refresh-contests/route.ts
 * Vercel Cron: runs every 30 minutes.
 * Fetches upcoming contests from all platform adapters and upserts into DB.
 * Protected by CRON_SECRET header.
 */
import { NextResponse } from "next/server";
import { env } from "@/env";
import { getAdapter } from "@/server/platforms";
import { platformEnum } from "@/server/db/schema";
import { upsertContests, updateContestPhases } from "@/server/services/contests";

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
    let totalUpserted = 0;
    const errors: string[] = [];
    const platforms = platformEnum.enumValues;

    for (const platform of platforms) {
      const adapter = getAdapter(platform);
      if (!adapter) {
        errors.push(`No adapter for ${platform}`);
        continue;
      }

      try {
        const upcoming = await adapter.fetchUpcomingContests();
        if (upcoming.length > 0) {
          const upserted = await upsertContests(platform, upcoming);
          totalUpserted += upserted;
        }
      } catch (err: unknown) {
        errors.push(
          `Failed to fetch ${platform} contests: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // Update phases of existing contests
    const phasesUpdated = await updateContestPhases();

    return NextResponse.json({
      ok: true,
      upserted: totalUpserted,
      phasesUpdated,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("[cron/refresh-contests] Error:", err);
    return NextResponse.json(
      { error: "Contest refresh failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}