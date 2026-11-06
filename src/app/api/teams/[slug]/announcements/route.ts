/**
 * GET /api/teams/[slug]/announcements
 * POST /api/teams/[slug]/announcements
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { teams, teamMembers } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import {
  createAnnouncement,
  listAnnouncements,
} from "@/server/services/teams";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  imageUrl: z
    .union([
      z.string().url().max(500),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  linkUrl: z
    .union([z.string().url().max(500), z.literal(""), z.null()])
    .optional(),
});

async function resolveTeamAccess(slug: string, userId?: string) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, slug),
  });
  if (!team) return { error: NextResponse.json({ error: "Team not found" }, { status: 404 }) };

  if (team.visibility === "PUBLIC") {
    return { team };
  }

  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const membership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)),
  });

  if (!membership || membership.status !== "ACTIVE") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { team };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    const { slug } = await params;
    const access = await resolveTeamAccess(slug, session?.user?.id);
    if (access.error) return access.error;

    const announcements = await listAnnouncements(access.team!.id);
    return NextResponse.json({ announcements });
  } catch (err: unknown) {
    console.error("[GET /api/teams/[slug]/announcements]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load announcements" },
      { status: 500 },
    );
  }
}

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
    const team = await db.query.teams.findFirst({ where: eq(teams.slug, slug) });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const announcement = await createAnnouncement(
      team.id,
      session.user.id,
      parsed.data,
    );
    return NextResponse.json({ ok: true, announcement }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/teams/[slug]/announcements]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create announcement" },
      { status: 500 },
    );
  }
}
