/**
 * src/app/api/teams/[slug]/members/[userId]/route.ts
 * PATCH /api/teams/[slug]/members/[userId] - Update member role
 * DELETE /api/teams/[slug]/members/[userId] - Remove member
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { z } from "zod";
import { db } from "@/server/db";
import { teams, teamMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { updateMemberRole, removeMember } from "@/server/services/teams";

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MODERATOR", "MEMBER"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, userId } = await params;
    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    // Find team by slug
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Update role
    await updateMemberRole(team.id, session.user.id, userId, parsed.data.role);

    return NextResponse.json({ ok: true, message: "Role updated" });
  } catch (err: unknown) {
    console.error("[PATCH /api/teams/[slug]/members/[userId]] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update role" },
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

    // Remove member
    await removeMember(team.id, session.user.id, userId);

    return NextResponse.json({ ok: true, message: "Member removed" });
  } catch (err: unknown) {
    console.error("[DELETE /api/teams/[slug]/members/[userId]] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove member" },
      { status: 500 }
    );
  }
}