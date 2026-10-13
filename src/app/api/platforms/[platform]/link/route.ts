/**
 * src/app/api/platforms/[platform]/link/route.ts
 * POST — Initiate a platform account link
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { initiateAccountLink } from "@/server/services/platforms";
import { syncAccount } from "@/server/services/sync";
import { getAdapter } from "@/server/platforms";
import { z } from "zod";
import { platformEnum } from "@/server/db/schema";
import type { PlatformId } from "@/server/platforms/types";
import { clientIp, rateLimit } from "@/lib/rate-limit";

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

    const limited = rateLimit(
      `link:${session.user.id}:${clientIp(req)}`,
      20,
      60_000,
    );
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Too many link attempts. Retry in ${limited.retryAfterSec}s` },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
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

    const pid = platform as PlatformId;

    // Validate handle exists on platform first (UX + existence check)
    let adapter: ReturnType<typeof getAdapter>;
    try {
      adapter = getAdapter(pid);
    } catch (e: unknown) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Unsupported platform" },
        { status: 400 }
      );
    }

    try {
      await adapter.fetchProfile(parsed.data.handle.trim());
    } catch (e: unknown) {
      return NextResponse.json(
        {
          error:
            e instanceof Error
              ? e.message
              : `Could not find handle '${parsed.data.handle}' on ${platform}.`,
        },
        { status: 400 }
      );
    }

    const account = await initiateAccountLink(
      session.user.id,
      pid as typeof platformEnum.enumValues[number],
      parsed.data.handle.trim()
    );

    let synced = false;
    let syncError: string | undefined;
    try {
      await syncAccount(account.id);
      synced = true;
    } catch (err: unknown) {
      syncError = err instanceof Error ? err.message : String(err);
    }

    return NextResponse.json({
      ok: true,
      synced,
      syncError,
      account: {
        id: account.id,
        platform: account.platform,
        handle: account.handle,
      },
    });
  } catch (err: unknown) {
    console.error("[link route] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initiate link" },
      { status: 500 }
    );
  }
}
