import { createHash, randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { users, verificationTokens } from "@/server/db/schema";
import { env } from "@/env";
import { appUrl, sendImportantEmail } from "@/server/mail";
import { resetPasswordMail } from "@/server/mail/templates";

const RESET_TTL_MS = 60 * 60 * 1000;
const RESET_PREFIX = "pwreset:";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function identifierFor(email: string) {
  return `${RESET_PREFIX}${email.toLowerCase().trim()}`;
}

export async function requestPasswordReset(emailRaw: string) {
  const email = emailRaw.toLowerCase().trim();
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: {
      email: true,
      passwordHash: true,
      displayName: true,
      username: true,
    },
  });

  // Always opaque — no enumeration.
  if (!user?.passwordHash) {
    return { ok: true as const };
  }

  const raw = randomBytes(32).toString("hex");
  const token = hashToken(raw);
  const identifier = identifierFor(email);
  const expires = new Date(Date.now() + RESET_TTL_MS);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));

  await db.insert(verificationTokens).values({
    identifier,
    token,
    expires,
  });

  const resetUrl = appUrl(
    `/reset-password?token=${encodeURIComponent(raw)}&email=${encodeURIComponent(email)}`,
  );
  const mail = resetPasswordMail({
    displayName: user.displayName ?? user.username,
    resetUrl,
  });

  if (env.NODE_ENV !== "production" && !env.RESEND_API_KEY) {
    console.info(`[mail] password reset link (no Resend): ${resetUrl}`);
  }

  await sendImportantEmail({ to: email, ...mail });
  return { ok: true as const };
}

export async function resetPasswordWithToken(opts: {
  email: string;
  rawToken: string;
  newPassword: string;
}) {
  const email = opts.email.toLowerCase().trim();
  const identifier = identifierFor(email);
  const token = hashToken(opts.rawToken);

  const row = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, identifier),
      eq(verificationTokens.token, token),
    ),
  });

  if (!row) return { ok: false as const, reason: "invalid" as const };
  if (row.expires.getTime() < Date.now()) {
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, identifier));
    return { ok: false as const, reason: "expired" as const };
  }

  const passwordHash = await bcrypt.hash(opts.newPassword, 12);
  await db
    .update(users)
    .set({
      passwordHash,
      emailVerified: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.email, email));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));

  return { ok: true as const };
}
