/**
 * Vercel Cron: every 30 minutes.
 * Fetches upcoming contests from registered platform adapters only.
 */
import { NextResponse } from "next/server";
import { env } from "@/env";
import { refreshContestsFromAdapters } from "@/server/services/contests";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { upserted, errors } = await refreshContestsFromAdapters();
    return NextResponse.json({
      ok: true,
      upserted,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("[cron/refresh-contests] Error:", err);
    return NextResponse.json(
      {
        error: "Contest refresh failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
