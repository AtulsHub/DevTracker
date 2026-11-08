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
import { validateUsername } from "@/lib/username";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { issueEmailVerification } from "@/server/services/email-verification";

const registerSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimit(`register:${clientIp(req)}`, 10, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: `Too many attempts. Retry in ${limited.retryAfterSec}s`,
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const body = (await req.json()) as unknown;
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input" } },
        { status: 400 }
      );
    }

    const usernameCheck = validateUsername(parsed.data.username);
    if (!usernameCheck.ok || !usernameCheck.username) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: usernameCheck.error ?? "Invalid username",
          },
        },
        { status: 400 },
      );
    }

    const username = usernameCheck.username;
    const { email, password } = parsed.data;

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user (email or username)
    const existing = await db.query.users.findFirst({
      where: or(eq(users.email, normalizedEmail), eq(users.username, username)),
      columns: { email: true, username: true },
    });

    if (existing) {
      const field =
        existing.email === normalizedEmail ? "email" : "username";
      return NextResponse.json(
        { error: { code: "CONFLICT", message: `An account with this ${field} already exists.` } },
        { status: 409 }
      );
    }

    // Hash password (bcrypt, 12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user — emailVerified stays null until they confirm via Resend.
    await db.insert(users).values({
      email: normalizedEmail,
      username,
      displayName: username,
      passwordHash,
    });

    const issued = await issueEmailVerification({
      email: normalizedEmail,
      displayName: username,
    });

    return NextResponse.json(
      {
        ok: true,
        needsVerification: !issued.autoVerified,
        autoVerified: !!issued.autoVerified,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[register] Error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } },
      { status: 500 }
    );
  }
}
