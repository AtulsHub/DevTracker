/**
 * src/app/api/platforms/[platform]/verify/route.ts
 * POST — Verify a pending platform account link
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { verifyAccountLink } from "@/server/services/platforms";
import { z } from "zod";
import { platformEnum } from "@/server/db/schema";

const verifySchema = z.object({
  handle: z.string().min(1, "Handle is required"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform } = await params;

    // Validate platform enum
    if (!platformEnum.enumValues.includes(platform as typeof platformEnum.enumValues[number])) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const result = await verifyAccountLink(
      session.user.id,
      platform as typeof platformEnum.enumValues[number],
      parsed.data.handle
    );

    if (!result.verified) {
      return NextResponse.json(
        { error: "Verification failed. Please make sure you followed the instructions." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[verify route] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to verify account" },
      { status: 500 }
    );
  }
}
