/**
 * src/app/api/teams/route.ts
 * POST /api/teams - Create a new team
 * GET /api/teams - List user's teams
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { z } from "zod";
import { createTeam, getUserTeams, getPublicTeams } from "@/server/services/teams";

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "SECRET"]).default("PUBLIC"),
  memberVisibilityPolicy: z.enum(["EVERYONE", "FOLLOWERS", "TEAM", "ME"]).default("TEAM"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const team = await createTeam({
      ...parsed.data,
      ownerId: session.user.id,
    });

    return NextResponse.json({ ok: true, team }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/teams] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create team" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const publicOnly = searchParams.get("public") === "true";
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");

    if (publicOnly) {
      const teams = await getPublicTeams(limit, offset);
      return NextResponse.json({ teams });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teams = await getUserTeams(session.user.id);
    return NextResponse.json({ teams });
  } catch (err: unknown) {
    console.error("[GET /api/teams] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch teams" },
      { status: 500 }
    );
  }
}