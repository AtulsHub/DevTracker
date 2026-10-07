/**
 * src/app/api/auth/register/route.ts
 * POST /api/auth/register — create a new user account.
 * Validates input, hashes password, inserts into DB.
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9_-]+$/, "Username may only contain lowercase letters, numbers, hyphens, and underscores"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input" } },
        { status: 400 }
      );
    }

    const { username, email, password } = parsed.data;

    // Check for existing user (email or username)
    const existing = await db.query.users.findFirst({
      where: or(eq(users.email, email), eq(users.username, username)),
      columns: { email: true, username: true },
    });

    if (existing) {
      const field = existing.email === email ? "email" : "username";
      return NextResponse.json(
        { error: { code: "CONFLICT", message: `An account with this ${field} already exists.` } },
        { status: 409 }
      );
    }

    // Hash password (bcrypt, 12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    await db.insert(users).values({
      email,
      username,
      displayName: username,
      passwordHash,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[register] Error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } },
      { status: 500 }
    );
  }
}
