import { createHash, randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users, verificationTokens } from "@/server/db/schema";
import { env } from "@/env";
import { appUrl, sendImportantEmail } from "@/server/mail";
import { verifyEmailMail } from "@/server/mail/templates";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueEmailVerification(opts: {
  email: string;
  displayName: string;
}) {
  const email = opts.email.toLowerCase().trim();

  // Local/dev without Resend: auto-verify so credentials signup still works.
  if (env.NODE_ENV !== "production" && !env.RESEND_API_KEY) {
    await db
      .update(users)
      .set({ emailVerified: new Date(), updatedAt: new Date() })
      .where(eq(users.email, email));
    console.info(`[mail] auto-verified ${email} (no Resend in ${env.NODE_ENV})`);
    return { expires: new Date(), autoVerified: true as const };
  }

  const raw = randomBytes(32).toString("hex");
  const token = hashToken(raw);
  const expires = new Date(Date.now() + VERIFY_TTL_MS);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  const verifyUrl = appUrl(
    `/api/auth/verify-email?token=${encodeURIComponent(raw)}&email=${encodeURIComponent(email)}`,
  );
  const mail = verifyEmailMail({
    displayName: opts.displayName,
    verifyUrl,
  });
  await sendImportantEmail({ to: email, ...mail });
  return { expires, autoVerified: false as const };
}

export async function consumeEmailVerification(opts: {
  email: string;
  rawToken: string;
}) {
  const email = opts.email.toLowerCase().trim();
  const token = hashToken(opts.rawToken);

  const row = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, email),
      eq(verificationTokens.token, token),
    ),
  });

  if (!row) return { ok: false as const, reason: "invalid" as const };
  if (row.expires.getTime() < Date.now()) {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, token),
        ),
      );
    return { ok: false as const, reason: "expired" as const };
  }

  await db
    .update(users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(users.email, email));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  return { ok: true as const };
}
