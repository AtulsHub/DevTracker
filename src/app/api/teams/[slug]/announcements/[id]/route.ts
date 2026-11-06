/**
 * DELETE /api/teams/[slug]/announcements/[id]
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { deleteAnnouncement } from "@/server/services/teams";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, id } = await params;
    const team = await db.query.teams.findFirst({ where: eq(teams.slug, slug) });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    await deleteAnnouncement(team.id, id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[DELETE /api/teams/[slug]/announcements/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete announcement" },
      { status: 500 },
    );
  }
}
