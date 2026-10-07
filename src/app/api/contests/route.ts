/**
 * src/app/api/contests/route.ts
 * GET /api/contests — Get contests with filters
 * Query params: platform, startDate, endDate, phase, limit, offset
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContests, getUpcomingContests } from "@/server/services/contests";

const querySchema = z.object({
  platform: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  phase: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
  upcoming: z.coerce.boolean().default(false),
  days: z.coerce.number().min(1).max(365).default(30),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { platform, startDate, endDate, phase, limit, offset, upcoming, days } = parsed.data;

    let contests;
    if (upcoming) {
      contests = await getUpcomingContests(platform, days);
    } else {
      contests = await getContests({
        platform,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        phase,
        limit,
        offset,
      });
    }

    return NextResponse.json({ contests });
  } catch (err: unknown) {
    console.error("[GET /api/contests] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch contests" },
      { status: 500 }
    );
  }
}