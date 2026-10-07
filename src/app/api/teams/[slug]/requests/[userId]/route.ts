/**
 * src/app/api/teams/[slug]/requests/[userId]/route.ts
 * POST /api/teams/[slug]/requests/[userId] - Approve join request
 * DELETE /api/teams/[slug]/requests/[userId] - Reject join request
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { teams, teamMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { approveJoinRequest, rejectJoinRequest } from "@/server/services/teams";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, userId } = await params;

    // Find team by slug
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Approve request
    await approveJoinRequest(team.id, session.user.id, userId);

    return NextResponse.json({ ok: true, message: "Join request approved" });
  } catch (err: unknown) {
    console.error("[POST /api/teams/[slug]/requests/[userId]] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to approve request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, userId } = await params;

    // Find team by slug
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Reject request
    await rejectJoinRequest(team.id, session.user.id, userId);

    return NextResponse.json({ ok: true, message: "Join request rejected" });
  } catch (err: unknown) {
    console.error("[DELETE /api/teams/[slug]/requests/[userId]] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reject request" },
      { status: 500 }
    );
  }
}