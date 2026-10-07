/**
 * src/app/api/health/route.ts
 * Health check endpoint — returns DB status.
 * Used by Vercel, CI/CD pipelines, and monitoring.
 */
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  try {
    // Lightweight DB ping
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      ok: true,
      db: "ok",
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[health] DB check failed:", err);

    return NextResponse.json(
      {
        ok: false,
        db: "error",
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
