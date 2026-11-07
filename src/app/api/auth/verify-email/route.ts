import { NextResponse } from "next/server";
import { consumeEmailVerification } from "@/server/services/email-verification";
import { env } from "@/env";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");
  const base = env.APP_URL.replace(/\/$/, "");

  if (!token || !email) {
    return NextResponse.redirect(
      `${base}/sign-in?error=missing_verification`,
    );
  }

  const result = await consumeEmailVerification({ email, rawToken: token });
  if (!result.ok) {
    return NextResponse.redirect(
      `${base}/sign-in?error=${result.reason === "expired" ? "verification_expired" : "verification_invalid"}`,
    );
  }

  return NextResponse.redirect(`${base}/sign-in?verified=1`);
}
