/**
 * GET /api/teams/[slug]/leaderboard?range=daily|weekly|monthly|all-time
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { teams, teamMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getTeamLeaderboard,
  type LeaderboardRange,
} from "@/server/services/leaderboard";

const RANGES: LeaderboardRange[] = ["daily", "weekly", "monthly", "all-time"];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range") ?? "weekly";
    const range: LeaderboardRange = RANGES.includes(
      rangeParam as LeaderboardRange,
    )
      ? (rangeParam as LeaderboardRange)
      : "weekly";

    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.visibility !== "PUBLIC") {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Team is private" }, { status: 403 });
      }

      const membership = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, team.id),
          eq(teamMembers.userId, session.user.id),
        ),
      });

      if (!membership || membership.status !== "ACTIVE") {
        return NextResponse.json({ error: "Team is private" }, { status: 403 });
      }
    }

    const leaderboard = await getTeamLeaderboard(team.id, range);
    return NextResponse.json({ leaderboard, range });
  } catch (err: unknown) {
    console.error("[GET /api/teams/[slug]/leaderboard] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch leaderboard",
      },
      { status: 500 },
    );
  }
}
