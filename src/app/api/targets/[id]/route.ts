/**
 * DELETE /api/targets/[id] — remove a personal or team target.
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { deleteTarget } from "@/server/services/targets";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: "Missing target id" }, { status: 400 });
    }

    await deleteTarget(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const status =
      typeof err === "object" &&
      err &&
      "status" in err &&
      typeof (err as { status: unknown }).status === "number"
        ? (err as { status: number }).status
        : 500;
    console.error("[DELETE /api/targets/:id] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to delete target",
      },
      { status },
    );
  }
}
