/**
 * src/app/api/targets/route.ts
 * POST /api/targets - Create a target
 * GET /api/targets - Get user's targets
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { z } from "zod";
import { createTarget, getUserTargets } from "@/server/services/targets";

const createTargetSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["SOLVE_COUNT", "SPECIFIC_PROBLEMS", "CONTEST_PARTICIPATION", "RATING_GOAL", "STREAK", "CUSTOM_CHECKLIST"]),
  goalValue: z.number().min(1),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  criteria: z.any().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createTargetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const target = await createTarget({
      userId: session.user.id,
      title: parsed.data.title,
      type: parsed.data.type,
      goalValue: parsed.data.goalValue,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      criteria: parsed.data.criteria,
    });

    return NextResponse.json({ ok: true, target }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/targets] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create target" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targets = await getUserTargets(session.user.id);
    return NextResponse.json({ targets });
  } catch (err: unknown) {
    console.error("[GET /api/targets] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch targets" },
      { status: 500 }
    );
  }
}