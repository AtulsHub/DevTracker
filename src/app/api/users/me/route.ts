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

const educationSchema = z.array(
  z.object({
    id: z.string().min(1).max(64),
    school: z.string().min(1).max(160),
    degree: z.string().max(120).optional(),
    field: z.string().max(120).optional(),
    startYear: z.string().max(20).optional(),
    endYear: z.string().max(20).optional(),
    description: z.string().max(500).optional(),
  }),
);

const experienceSchema = z.array(
  z.object({
    id: z.string().min(1).max(64),
    company: z.string().min(1).max(160),
    title: z.string().min(1).max(160),
    startDate: z.string().max(40).optional(),
    endDate: z.string().max(40).optional(),
    current: z.boolean().optional(),
    description: z.string().max(800).optional(),
  }),
);

const projectSchema = z.array(
  z.object({
    id: z.string().min(1).max(64),
    name: z.string().min(1).max(160),
    url: z.string().max(500).optional(),
    description: z.string().max(800).optional(),
    tech: z.string().max(240).optional(),
  }),
);

const certificationSchema = z.array(
  z.object({
    id: z.string().min(1).max(64),
    name: z.string().min(1).max(160),
    issuer: z.string().max(160).optional(),
    year: z.string().max(20).optional(),
    url: z.string().max(500).optional(),
  }),
);

const customLinkSchema = z.array(
  z.object({
    id: z.string().min(1).max(64),
    label: z.string().min(1).max(80),
    url: z.string().url().max(500),
  }),
);

const updateProfileSchema = z
  .object({
    displayName: z.union([z.string().min(1).max(80), z.null()]).optional(),
    bio: z.union([z.string().max(1200), z.null()]).optional(),
    headline: z.union([z.string().max(160), z.null()]).optional(),
    location: z.union([z.string().max(120), z.null()]).optional(),
    age: z.union([z.number().int().min(13).max(120), z.null()]).optional(),
    websiteUrl: optionalUrl,
    githubUrl: optionalUrl,
    linkedinUrl: optionalUrl,
    twitterUrl: optionalUrl,
    resumeUrl: optionalUrl,
    college: z.union([z.string().max(120), z.null()]).optional(),
    skills: z.union([z.string().max(400), z.null()]).optional(),
    openToWork: z.boolean().optional(),
    education: educationSchema.max(20).optional(),
    experience: experienceSchema.max(30).optional(),
    projects: projectSchema.max(30).optional(),
    certifications: certificationSchema.max(30).optional(),
    customLinks: customLinkSchema.max(20).optional(),
    // Cloudinary HTTPS URLs (legacy base64 data URLs still accepted for old rows)
    avatarUrl: z
      .union([
        z.string().url().max(500),
        z
          .string()
          .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/i)
          .max(400_000),
        z.literal(""),
        z.null(),
      ])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    timezone: z.string().min(1).max(60).optional(),
    profileVisibility: z
      .enum(["PUBLIC", "FOLLOWERS_ONLY", "PRIVATE"])
      .optional(),
    discoverable: z.boolean().optional(),
    contestRemindersEnabled: z.boolean().optional(),
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
  linkedinUrl: users.linkedinUrl,
  twitterUrl: users.twitterUrl,
  resumeUrl: users.resumeUrl,
  college: users.college,
  skills: users.skills,
  openToWork: users.openToWork,
  education: users.education,
  experience: users.experience,
  projects: users.projects,
  certifications: users.certifications,
  customLinks: users.customLinks,
  timezone: users.timezone,
  contestRemindersEnabled: users.contestRemindersEnabled,
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
