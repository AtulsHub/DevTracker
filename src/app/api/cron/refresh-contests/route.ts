/**
 * Vercel Cron: every 30 minutes.
 * Fetches upcoming contests from registered platform adapters only.
 */
import { NextResponse } from "next/server";
import { env } from "@/env";
import { isAuthorizedCronRequest } from "@/server/auth/cron";
import { refreshContestsFromAdapters } from "@/server/services/contests";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { upserted, errors, sources } = await refreshContestsFromAdapters();
    return NextResponse.json({
      ok: true,
      upserted,
      sources,
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
