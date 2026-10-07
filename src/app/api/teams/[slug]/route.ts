/**
 * src/app/api/teams/[slug]/route.ts
 * GET /api/teams/[slug] - Get team details
 * PATCH /api/teams/[slug] - Update team (admin/owner only)
 * DELETE /api/teams/[slug] - Delete team (owner only)
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { z } from "zod";
import { db } from "@/server/db";
import { teams, teamMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getTeamBySlug, updateMemberRole, removeMember } from "@/server/services/teams";

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "SECRET"]).optional(),
  memberVisibilityPolicy: z.enum(["EVERYONE", "FOLLOWERS", "TEAM", "ME"]).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await params;

    const team = await getTeamBySlug(slug, session?.user?.id);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check visibility for private/secret teams
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

    return NextResponse.json({ team });
  } catch (err: unknown) {
    console.error("[GET /api/teams/[slug]] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch team" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const parsed = updateTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    // Get team and verify ownership
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can update team settings" }, { status: 403 });
    }

    const [updated] = await db
      .update(teams)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, team.id))
      .returning();

    return NextResponse.json({ ok: true, team: updated });
  } catch (err: unknown) {
    console.error("[PATCH /api/teams/[slug]] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Get team and verify ownership
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can delete the team" }, { status: 403 });
    }

    await db.delete(teams).where(eq(teams.id, team.id));

    return NextResponse.json({ ok: true, message: "Team deleted" });
  } catch (err: unknown) {
    console.error("[DELETE /api/teams/[slug]] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete team" },
      { status: 500 }
    );
  }
}