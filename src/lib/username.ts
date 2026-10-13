/**
 * Username validation rules for DevTrack.
 */
const RESERVED = new Set([
  "admin",
  "api",
  "settings",
  "dashboard",
  "activity",
  "contests",
  "teams",
  "onboarding",
  "sign-in",
  "sign-up",
  "login",
  "logout",
  "me",
  "null",
  "undefined",
  "devtrack",
  "support",
  "help",
]);

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): {
  ok: boolean;
  username?: string;
  error?: string;
} {
  const username = normalizeUsername(raw);
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: "Username must be 3–20 chars: lowercase letters, numbers, underscore",
    };
  }
  if (RESERVED.has(username)) {
    return { ok: false, error: "That username is reserved" };
  }
  return { ok: true, username };
}
