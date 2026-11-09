import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/admin";
import {
  moderateUserContent,
  patchAdminUser,
} from "@/server/services/admin";

const bodySchema = z
  .object({
    disabled: z.boolean().optional(),
    isAdmin: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
    discoverable: z.boolean().optional(),
    clearBio: z.boolean().optional(),
    clearAvatar: z.boolean().optional(),
    clearHeadline: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const {
      clearBio,
      clearAvatar,
      clearHeadline,
      ...accountPatch
    } = parsed.data;

    let user = null;
    if (
      accountPatch.disabled !== undefined ||
      accountPatch.isAdmin !== undefined ||
      accountPatch.emailVerified !== undefined ||
      accountPatch.discoverable !== undefined
    ) {
      user = await patchAdminUser(gate.admin.id, id, accountPatch);
    }
    if (clearBio || clearAvatar || clearHeadline) {
      user = await moderateUserContent(gate.admin.id, id, {
        clearBio,
        clearAvatar,
        clearHeadline,
      });
    }
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}
