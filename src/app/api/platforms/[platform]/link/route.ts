/**
 * src/app/api/platforms/[platform]/link/route.ts
 * POST — Initiate a platform account link
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { initiateAccountLink } from "@/server/services/platforms";
import { z } from "zod";
import { platformEnum } from "@/server/db/schema";

const linkSchema = z.object({
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
    const parsed = linkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const account = await initiateAccountLink(
      session.user.id,
      platform as typeof platformEnum.enumValues[number],
      parsed.data.handle
    );

    return NextResponse.json({
      ok: true,
      verificationToken: account.verificationToken,
      instructions: `Please submit a failing solution to a problem and include '${account.verificationToken}' in the source code or follow platform-specific verification rules.`,
    });
  } catch (err: unknown) {
    console.error("[link route] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initiate link" },
      { status: 500 }
    );
  }
}
