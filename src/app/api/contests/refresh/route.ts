/**
 * POST /api/contests/refresh — manually pull upcoming contests from aggregators.
 * Protected by session OR CRON_SECRET (for local/dev convenience).
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { env } from "@/env";
import { refreshContestsFromAdapters } from "@/server/services/contests";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  const authHeader = req.headers.get("authorization");
  const cronOk =
    !!env.CRON_SECRET && authHeader === `Bearer ${env.CRON_SECRET}`;

  if (!session?.user?.id && !cronOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshContestsFromAdapters();
    return NextResponse.json({
      ok: true,
      upserted: result.upserted,
      sources: result.sources,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err: unknown) {
    console.error("[POST /api/contests/refresh]", err);
    return NextResponse.json(
      {
        error: "Contest refresh failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
