/**
 * GET /api/teams/[slug]/activity
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { teams, teamMembers } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { getTeamActivity } from "@/server/services/teams";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const days = Math.min(
      90,
      Math.max(1, parseInt(searchParams.get("days") ?? "14", 10) || 14),
    );
    const limit = Math.min(
      150,
      Math.max(20, parseInt(searchParams.get("limit") ?? "80", 10) || 80),
    );

    const team = await db.query.teams.findFirst({ where: eq(teams.slug, slug) });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.visibility !== "PUBLIC") {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const membership = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, team.id),
          eq(teamMembers.userId, session.user.id),
        ),
      });
      if (!membership || membership.status !== "ACTIVE") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const activity = await getTeamActivity(team.id, days, limit);
    return NextResponse.json({ activity, days, limit });
  } catch (err: unknown) {
    console.error("[GET /api/teams/[slug]/activity]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load activity" },
      { status: 500 },
    );
  }
}
