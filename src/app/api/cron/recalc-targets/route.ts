/**
 * Vercel Cron: hourly — recalculate active target progress from solves.
 */
import { NextResponse } from "next/server";
import { env } from "@/env";
import { recalculateAllActiveTargets } from "@/server/services/targets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await recalculateAllActiveTargets();
    return NextResponse.json({
      ok: true,
      recalculated: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("[cron/recalc-targets] Error:", err);
    return NextResponse.json(
      {
        error: "Recalc failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
