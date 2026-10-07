/**
 * src/server/services/social.ts
 * Business logic for follow system and social features.
 */
import { db } from "@/server/db";
import { follows, users, privacySettings, platformAccounts } from "@/server/db/schema";
import { eq, and, or, desc, count, sql } from "drizzle-orm";
import { canView } from "@/server/privacy/can-view";

export interface FollowResult {
  success: boolean;
  followId?: string;
  status?: "PENDING" | "ACCEPTED" | "BLOCKED";
  error?: string;
}

/**
 * Follow a user (send follow request).
 * If target profile is PUBLIC, follow is instantly ACCEPTED.
 * Otherwise, it's PENDING until approved.
 */
export async function followUser(
  followerId: string,
  followeeId: string
): Promise<FollowResult> {
  if (followerId === followeeId) {
    return { success: false, error: "Cannot follow yourself" };
  }

  // Check if followee exists
  const followee = await db.query.users.findFirst({
    where: eq(users.id, followeeId),
    columns: { id: true, profileVisibility: true },
  });

  if (!followee) {
    return { success: false, error: "User not found" };
  }

  // Check existing follow
  const existing = await db.query.follows.findFirst({
    where: and(
      eq(follows.followerId, followerId),
      eq(follows.followeeId, followeeId)
    ),
  });

  if (existing) {
    if (existing.status === "BLOCKED") {
      return { success: false, error: "You have been blocked" };
    }
    if (existing.status === "ACCEPTED") {
      return { success: false, error: "Already following" };
    }
    if (existing.status === "PENDING") {
      return { success: false, error: "Follow request already sent" };
    }
  }

  // Determine initial status based on profile visibility
  const initialStatus = followee.profileVisibility === "PUBLIC" ? "ACCEPTED" : "PENDING";

  const [newFollow] = await db
    .insert(follows)
    .values({
      followerId,
      followeeId,
      status: initialStatus,
    })
    .onConflictDoUpdate({
      target: [follows.followerId, follows.followeeId],
      set: { status: initialStatus },
    })
    .returning({ followerId: follows.followerId, followeeId: follows.followeeId, status: follows.status });

  return {
    success: true,
    followId: `${newFollow.followerId}:${newFollow.followeeId}`,
    status: newFollow.status,
  };
}

/**
 * Unfollow a user (remove follow relationship).
 */
export async function unfollowUser(
  followerId: string,
  followeeId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));

  return { success: result.rowCount > 0 };
}

/**
 * Accept a follow request.
 */
export async function acceptFollowRequest(
  followeeId: string,
  followerId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await db
    .update(follows)
    .set({ status: "ACCEPTED" })
    .where(
      and(
        eq(follows.followeeId, followeeId),
        eq(follows.followerId, followerId),
        eq(follows.status, "PENDING")
      )
    );

  return { success: result.rowCount > 0 };
}

/**
 * Reject a follow request.
 */
export async function rejectFollowRequest(
  followeeId: string,
  followerId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await db
    .delete(follows)
    .where(
      and(
        eq(follows.followeeId, followeeId),
        eq(follows.followerId, followerId),
        eq(follows.status, "PENDING")
      )
    );

  return { success: result.rowCount > 0 };
}

/**
 * Block a user.
 */
export async function blockUser(
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; error?: string }> {
  // Remove any existing follow relationship first
  await db
    .delete(follows)
    .where(
      or(
        and(eq(follows.followerId, blockerId), eq(follows.followeeId, blockedId)),
        and(eq(follows.followerId, blockedId), eq(follows.followeeId, blockerId))
      )
    );

  // Create block
  await db
    .insert(follows)
    .values({
      followerId: blockerId,
      followeeId: blockedId,
      status: "BLOCKED",
    })
    .onConflictDoUpdate({
      target: [follows.followerId, follows.followeeId],
      set: { status: "BLOCKED" },
    });

  return { success: true };
}

/**
 * Get follow status between two users.
 */
export async function getFollowStatus(
  followerId: string,
  followeeId: string
): Promise<"NONE" | "PENDING" | "ACCEPTED" | "BLOCKED"> {
  const follow = await db.query.follows.findFirst({
    where: and(
      eq(follows.followerId, followerId),
      eq(follows.followeeId, followeeId)
    ),
    columns: { status: true },
  });

  return follow?.status ?? "NONE";
}

/**
 * Get followers of a user (with privacy checks).
 */
export async function getFollowers(
  userId: string,
  viewerId: string | null,
  limit = 50,
  offset = 0
) {
  const followerRows = await db
    .select({
      followerId: follows.followerId,
      status: follows.status,
      createdAt: follows.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followerId))
    .where(and(eq(follows.followeeId, userId), eq(follows.status, "ACCEPTED")))
    .orderBy(desc(follows.createdAt))
    .limit(limit)
    .offset(offset);

  // Filter by privacy
  const visibleFollowers = [];
  for (const f of followerRows) {
    const canSee = await canView(viewerId, f.followerId, "linked_handles");
    if (canSee) {
      visibleFollowers.push(f);
    }
  }

  return visibleFollowers;
}

/**
 * Get users that a user is following (with privacy checks).
 */
export async function getFollowing(
  userId: string,
  viewerId: string | null,
  limit = 50,
  offset = 0
) {
  const followingRows = await db
    .select({
      followeeId: follows.followeeId,
      status: follows.status,
      createdAt: follows.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followeeId))
    .where(and(eq(follows.followerId, userId), eq(follows.status, "ACCEPTED")))
    .orderBy(desc(follows.createdAt))
    .limit(limit)
    .offset(offset);

  // Filter by privacy
  const visibleFollowing = [];
  for (const f of followingRows) {
    const canSee = await canView(viewerId, f.followeeId, "linked_handles");
    if (canSee) {
      visibleFollowing.push(f);
    }
  }

  return visibleFollowing;
}

/**
 * Get pending follow requests for a user.
 */
export async function getPendingFollowRequests(userId: string) {
  return db
    .select({
      followerId: follows.followerId,
      createdAt: follows.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followerId))
    .where(and(eq(follows.followeeId, userId), eq(follows.status, "PENDING")))
    .orderBy(desc(follows.createdAt));
}

/**
 * Get follow counts for a user.
 */
export async function getFollowCounts(userId: string) {
  const [followersCount, followingCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(follows)
      .where(and(eq(follows.followeeId, userId), eq(follows.status, "ACCEPTED"))),
    db
      .select({ count: count() })
      .from(follows)
      .where(and(eq(follows.followerId, userId), eq(follows.status, "ACCEPTED"))),
  ]);

  return {
    followers: followersCount[0]?.count ?? 0,
    following: followingCount[0]?.count ?? 0,
  };
}

/**
 * Search users by username or display name.
 */
export async function searchUsers(
  query: string,
  viewerId: string | null,
  limit = 20
) {
  if (!query.trim() || query.length < 2) return [];

  const results = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      profileVisibility: users.profileVisibility,
    })
    .from(users)
    .where(
      and(
        or(
          sql`${users.username} ILIKE ${`%${query}%`}`,
          sql`${users.displayName} ILIKE ${`%${query}%`}`
        ),
        eq(users.discoverable, true)
      )
    )
    .limit(limit);

  // Filter by privacy - only show users that viewer can see
  const visibleResults = [];
  for (const u of results) {
    const canSee = await canView(viewerId, u.id, "linked_handles");
    if (canSee) {
      visibleResults.push(u);
    }
  }

  return visibleResults;
}