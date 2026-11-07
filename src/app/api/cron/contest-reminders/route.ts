/**
 * Vercel Cron: every 15 minutes.
 * Creates in-app contest reminders only — no email.
 */
import { NextResponse } from "next/server";
import { env } from "@/env";
import { dispatchContestReminders } from "@/server/services/contest-reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await dispatchContestReminders();
    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("[cron/contest-reminders] Error:", err);
    return NextResponse.json(
      {
        error: "Contest reminders failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
