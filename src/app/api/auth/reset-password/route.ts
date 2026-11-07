import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { resetPasswordWithToken } from "@/server/services/password-reset";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(20),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimit(`reset-pw:${clientIp(req)}`, 8, 60_000);
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
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        },
        { status: 400 },
      );
    }

    const result = await resetPasswordWithToken({
      email: parsed.data.email,
      rawToken: parsed.data.token,
      newPassword: parsed.data.password,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: {
            code: result.reason.toUpperCase(),
            message:
              result.reason === "expired"
                ? "Reset link expired. Request a new one."
                : "Invalid reset link.",
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Could not reset password" } },
      { status: 500 },
    );
  }
}
