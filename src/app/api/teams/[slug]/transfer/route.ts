/**
 * POST /api/teams/[slug]/transfer
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { transferOwnership } from "@/server/services/teams";

const schema = z.object({
  userId: z.string().min(1),
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

    const team = await db.query.teams.findFirst({ where: eq(teams.slug, slug) });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    await transferOwnership(team.id, session.user.id, parsed.data.userId);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[POST /api/teams/[slug]/transfer]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to transfer ownership" },
      { status: 500 },
    );
  }
}