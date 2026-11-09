/** Bootstrap admins from env without importing auth (avoids cycles). */
export function adminEmailsFromEnv(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function emailIsAdminBootstrap(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  return adminEmailsFromEnv().has(email.trim().toLowerCase());
}
