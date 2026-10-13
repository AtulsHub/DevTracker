/**
 * GET /api/users/me — current user's editable profile.
 * PATCH /api/users/me — update profile fields shown on public profiles.
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

const optionalUrl = z
  .union([z.string().url().max(500), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

const updateProfileSchema = z
  .object({
    displayName: z.union([z.string().min(1).max(80), z.null()]).optional(),
    bio: z.union([z.string().max(500), z.null()]).optional(),
    headline: z.union([z.string().max(160), z.null()]).optional(),
    location: z.union([z.string().max(120), z.null()]).optional(),
    age: z.union([z.number().int().min(13).max(120), z.null()]).optional(),
    websiteUrl: optionalUrl,
    githubUrl: optionalUrl,
    college: z.union([z.string().max(120), z.null()]).optional(),
    skills: z.union([z.string().max(400), z.null()]).optional(),
    avatarUrl: z.union([z.string().max(400_000), z.null()]).optional(),
    timezone: z.string().min(1).max(60).optional(),
    profileVisibility: z
      .enum(["PUBLIC", "FOLLOWERS_ONLY", "PRIVATE"])
      .optional(),
    discoverable: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });

export const PROFILE_COLUMNS = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  avatarUrl: users.avatarUrl,
  bio: users.bio,
  headline: users.headline,
  location: users.location,
  age: users.age,
  websiteUrl: users.websiteUrl,
  githubUrl: users.githubUrl,
  college: users.college,
  skills: users.skills,
  timezone: users.timezone,
  profileVisibility: users.profileVisibility,
  discoverable: users.discoverable,
} as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select(PROFILE_COLUMNS)
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  const data = { ...parsed.data };
  if (data.avatarUrl && data.avatarUrl.startsWith("data:")) {
    if (data.avatarUrl.length > 350_000) {
      return NextResponse.json(
        { error: "Image too large — use a smaller photo (under ~250KB)" },
        { status: 400 },
      );
    }
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(data.avatarUrl)) {
      return NextResponse.json(
        { error: "Avatar must be a JPEG, PNG, or WebP image" },
        { status: 400 },
      );
    }
  }

  try {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, session.user.id))
      .returning(PROFILE_COLUMNS);

    return NextResponse.json({ ok: true, user });
  } catch (err: unknown) {
    console.error("[PATCH /api/users/me] Error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
