/**
 * src/app/api/teams/[slug]/members/route.ts
 * POST /api/teams/[slug]/members - Join team or request to join
 * GET /api/teams/[slug]/members - List team members (with pagination)
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { teams, teamMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { joinTeamByInvite, requestToJoinTeam, getTeamMembers, getPendingRequests } from "@/server/services/teams";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json();
    const { inviteCode } = body;

    // Find team by slug
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (inviteCode) {
      // Join via invite code
      const result = await joinTeamByInvite(inviteCode, session.user.id);
      return NextResponse.json({ ok: true, ...result });
    } else {
      // Request to join
      const result = await requestToJoinTeam(team.id, session.user.id);
      return NextResponse.json({ ok: true, ...result });
    }
  } catch (err: unknown) {
    console.error("[POST /api/teams/[slug]/members] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to join team" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const pending = searchParams.get("pending") === "true";

    // Find team by slug
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user can view members
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

    if (pending) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const requests = await getPendingRequests(team.id, session.user.id);
      return NextResponse.json({ requests });
    }

    const members = await getTeamMembers(team.id, limit, offset);
    return NextResponse.json({ members });
  } catch (err: unknown) {
    console.error("[GET /api/teams/[slug]/members] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch members" },
      { status: 500 }
    );
  }
}