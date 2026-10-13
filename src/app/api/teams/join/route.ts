/**
 * src/app/api/teams/join/route.ts
 * POST /api/teams/join — join a team using only its invite code.
 * (The `[slug]/members` route also supports invites, but requires the slug;
 * onboarding users typically only have the code.)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { joinTeamByInvite } from "@/server/services/teams";

const joinSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(1, "Invite code is required")
    .max(32, "Invite code is too long"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const result = await joinTeamByInvite(
      parsed.data.inviteCode.toUpperCase(),
      session.user.id
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    console.error("[POST /api/teams/join] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to join team" },
      { status: 400 }
    );
  }
}
