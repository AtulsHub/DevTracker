/**
 * POST /api/teams/[slug]/invite — owner/admin adds a member by username.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { addMemberByUsername } from "@/server/services/teams";

const schema = z.object({
  username: z.string().min(1).max(40),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, slug),
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const result = await addMemberByUsername(
      team.id,
      session.user.id,
      parsed.data.username,
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    console.error("[POST /api/teams/[slug]/invite] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to invite" },
      { status: 400 },
    );
  }
}
