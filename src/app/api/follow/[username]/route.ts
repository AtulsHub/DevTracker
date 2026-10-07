/**
 * src/app/api/follow/[username]/route.ts
 * POST /api/follow/[username] - Follow or unfollow a user
 * DELETE /api/follow/[username] - Unfollow a user
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users, follows } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { followUser, unfollowUser, getFollowStatus } from "@/server/services/social";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;

    // Find target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const result = await followUser(session.user.id, targetUser.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      status: result.status,
      message: result.status === "ACCEPTED" ? "Now following" : "Follow request sent",
    });
  } catch (err: unknown) {
    console.error("[POST /api/follow] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to follow user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;

    // Find target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await unfollowUser(session.user.id, targetUser.id);

    if (!result.success) {
      return NextResponse.json({ error: "Not following this user" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Unfollowed" });
  } catch (err: unknown) {
    console.error("[DELETE /api/follow] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to unfollow user" },
      { status: 500 }
    );
  }
}