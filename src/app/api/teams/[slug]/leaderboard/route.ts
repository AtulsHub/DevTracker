/**
 * src/app/api/teams/[slug]/leaderboard/route.ts
 * GET /api/teams/[slug]/leaderboard - Get team leaderboard.
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { teams, teamMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getTeamLeaderboard } from "@/server/services/leaderboard";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const weekOffset = parseInt(searchParams.get("week") ?? "0");

    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user can view team
    if (team.visibility !== "PUBLIC") {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Team is private" }, { status: 403 });
      }

      const membership = await db.query.teamMembers.findFirst({
        where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, session.user.id)),
      });

      if (!membership || membership.status !== "ACTIVE") {
        return NextResponse.json({ error: "Team is private" }, { status: 403 });
      }
    }

    const leaderboard = await getTeamLeaderboard(team.id, weekOffset);
    return NextResponse.json({ leaderboard, weekOffset });
  } catch (err: unknown) {
    console.error("[GET /api/teams/[slug]/leaderboard] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}