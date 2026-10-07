/**
 * src/server/services/platforms.ts
 * Business logic for linking platform accounts and verifying ownership.
 */
import { db } from "@/server/db";
import { platformAccounts, platformEnum } from "@/server/db/schema";
import { getAdapter } from "@/server/platforms";
import { eq, and } from "drizzle-orm";

type PlatformEnum = typeof platformEnum.enumValues[number];

export async function initiateAccountLink(userId: string, platform: PlatformEnum, handle: string) {
  const adapter = getAdapter(platform);
  if (!adapter) {
    throw new Error(`Platform adapter not found for ${platform}`);
  }

  // Check if this handle is already linked by anyone
  const existing = await db.query.platformAccounts.findFirst({
    where: and(eq(platformAccounts.platform, platform), eq(platformAccounts.handle, handle)),
  });

  if (existing) {
    if (existing.userId === userId && existing.syncStatus === "success") {
      throw new Error(`You have already linked ${handle} on ${platform}.`);
    }
    if (existing.userId !== userId && existing.syncStatus !== "pending") {
      throw new Error(`Handle ${handle} is already claimed by another user.`);
    }
    // If it's pending for this user or another user, we allow them to try verifying it and steal the pending claim
  }

  // Get verification token
  const token = crypto.randomUUID();

  // Upsert the pending account claim
  const [account] = await db
    .insert(platformAccounts)
    .values({
      userId,
      platform,
      handle,
      verificationToken: token,
      syncStatus: "pending",
    })
    .onConflictDoUpdate({
      target: [platformAccounts.platform, platformAccounts.handle],
      set: {
        userId, // Steal pending claim if another user didn't finish
        verificationToken: token,
        syncStatus: "pending",
      },
    })
    .returning();

  return account;
}

export async function verifyAccountLink(userId: string, platform: PlatformEnum, handle: string) {
  const adapter = getAdapter(platform);
  if (!adapter) {
    throw new Error(`Platform adapter not found for ${platform}`);
  }

  const account = await db.query.platformAccounts.findFirst({
    where: and(
      eq(platformAccounts.platform, platform),
      eq(platformAccounts.handle, handle),
      eq(platformAccounts.userId, userId)
    ),
  });

  if (!account) {
    throw new Error(`No pending link request found for ${handle} on ${platform}.`);
  }
  if (!account.verificationToken) {
    throw new Error("Verification token missing. Please restart the linking process.");
  }

  const isVerified = await adapter.verifyOwnership(handle, account.verificationToken);
  if (!isVerified) {
    return { verified: false };
  }

  // Update account as verified and fetch initial profile info
  const profile = await adapter.fetchProfile(handle);
  
  await db
    .update(platformAccounts)
    .set({
      syncStatus: "success", // Not fully synced yet, but the claim is verified
      currentRating: profile.currentRating,
      maxRating: profile.maxRating,
      rank: profile.rank,
    })
    .where(eq(platformAccounts.id, account.id));

  // Triggering the initial sync can happen asynchronously here or via the cron job
  // We'll leave it to the cron job for now (which picks up accounts that haven't been synced in a while)

  return { verified: true };
}
