import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/server/services/password-reset";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimit(`forgot-pw:${clientIp(req)}`, 5, 60_000);
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

    await requestPasswordReset(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Could not process request" } },
      { status: 500 },
    );
  }
}
