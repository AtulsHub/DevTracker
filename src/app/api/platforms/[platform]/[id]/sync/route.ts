/**
 * src/app/api/platforms/[platform]/[id]/sync/route.ts
 * POST — Trigger a manual sync for a specific platform account
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { platformAccounts, platformEnum } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { syncAccount } from "@/server/services/sync";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ platform: string; id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform, id } = await params;

    // Validate platform enum
    if (!platformEnum.enumValues.includes(platform as typeof platformEnum.enumValues[number])) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    // Verify ownership of the account
    const account = await db.query.platformAccounts.findFirst({
      where: and(
        eq(platformAccounts.id, id),
        eq(platformAccounts.userId, session.user.id),
        eq(platformAccounts.platform, platform as typeof platformEnum.enumValues[number])
      ),
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    
    if (account.syncStatus === "pending") {
      // Allow syncing pending accounts (auto-link + immediate sync)
    }

    // Cooldown check (5 minutes)
    if (account.lastSyncedAt) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (account.lastSyncedAt > fiveMinutesAgo) {
        return NextResponse.json(
          { error: "Please wait 5 minutes between manual syncs." },
          { status: 429 }
        );
      }
    }

    // Trigger sync
    const result = await syncAccount(account.id);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error(`[Manual sync] Error for account ${params}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to sync account" },
      { status: 500 }
    );
  }
}
