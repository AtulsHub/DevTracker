/**
 * Important-only transactional email via Resend.
 * Soft-fails when RESEND_API_KEY / EMAIL_FROM are unset (local/dev).
 */
import { Resend } from "resend";
import { env } from "@/env";

export type ImportantMail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function client() {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return null;
  return new Resend(env.RESEND_API_KEY);
}

/** Send only high-priority mail. Never throws — logs and returns false on failure. */
export async function sendImportantEmail(
  mail: ImportantMail,
): Promise<{ sent: boolean; skipped?: boolean }> {
  const resend = client();
  if (!resend) {
    console.info(
      `[mail] skipped (no Resend config): ${mail.subject} → ${mail.to}`,
    );
    return { sent: false, skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: env.EMAIL_FROM!,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    if (result.error) {
      console.error("[mail] Resend error:", result.error);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[mail] send failed:", err);
    return { sent: false };
  }
}

export function appUrl(path = "/") {
  const base = env.APP_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
