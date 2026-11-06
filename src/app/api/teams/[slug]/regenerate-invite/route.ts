/**
 * POST /api/teams/[slug]/regenerate-invite
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { regenerateInviteCode } from "@/server/services/teams";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const team = await db.query.teams.findFirst({ where: eq(teams.slug, slug) });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const updated = await regenerateInviteCode(team.id, session.user.id);
    return NextResponse.json({ ok: true, inviteCode: updated.inviteCode });
  } catch (err: unknown) {
    console.error("[POST /api/teams/[slug]/regenerate-invite]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to regenerate invite" },
      { status: 500 },
    );
  }
}
