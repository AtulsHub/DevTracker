import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { issueEmailVerification } from "@/server/services/email-verification";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimit(`resend-verify:${clientIp(req)}`, 5, 60_000);
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
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid email" } },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        email: true,
        emailVerified: true,
        passwordHash: true,
        displayName: true,
        username: true,
      },
    });

    // Always return ok to avoid email enumeration.
    if (user?.passwordHash && !user.emailVerified) {
      await issueEmailVerification({
        email: user.email,
        displayName: user.displayName ?? user.username,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Could not resend" } },
      { status: 500 },
    );
  }
}
