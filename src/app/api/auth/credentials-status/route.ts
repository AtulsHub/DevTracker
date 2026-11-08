/**
 * POST /api/auth/credentials-status
 * Check whether email+password are valid and if verification is still pending.
 * Used by sign-in UI when Auth.js collapses custom errors to CredentialsSignin.
 * Does NOT send email and does NOT create a session.
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimit(`cred-status:${clientIp(req)}`, 20, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: `Too many attempts. Retry in ${limited.retryAfterSec}s`,
          },
        },
        { status: 429 },
      );
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, needsVerification: false });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        passwordHash: true,
        emailVerified: true,
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ ok: false, needsVerification: false });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, needsVerification: false });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ ok: false, needsVerification: true });
    }

    return NextResponse.json({ ok: true, needsVerification: false });
  } catch (err) {
    console.error("[credentials-status]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 },
    );
  }
}
