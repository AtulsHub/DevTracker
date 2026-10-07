/**
 * src/app/api/follow/requests/[followerId]/route.ts
 * POST /api/follow/requests/[followerId] - Accept a follow request
 * DELETE /api/follow/requests/[followerId] - Reject a follow request
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { follows } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { acceptFollowRequest, rejectFollowRequest } from "@/server/services/social";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ followerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { followerId } = await params;

    // Verify this is a pending request TO the current user
    const followRequest = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, followerId),
        eq(follows.followeeId, session.user.id),
        eq(follows.status, "PENDING")
      ),
    });

    if (!followRequest) {
      return NextResponse.json({ error: "Follow request not found" }, { status: 404 });
    }

    const result = await acceptFollowRequest(session.user.id, followerId);

    if (!result.success) {
      return NextResponse.json({ error: "Failed to accept request" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Follow request accepted" });
  } catch (err: unknown) {
    console.error("[POST /api/follow/requests] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to accept request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ followerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { followerId } = await params;

    // Verify this is a pending request TO the current user
    const followRequest = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, followerId),
        eq(follows.followeeId, session.user.id),
        eq(follows.status, "PENDING")
      ),
    });

    if (!followRequest) {
      return NextResponse.json({ error: "Follow request not found" }, { status: 404 });
    }

    const result = await rejectFollowRequest(session.user.id, followerId);

    if (!result.success) {
      return NextResponse.json({ error: "Failed to reject request" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Follow request rejected" });
  } catch (err: unknown) {
    console.error("[DELETE /api/follow/requests] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reject request" },
      { status: 500 }
    );
  }
}