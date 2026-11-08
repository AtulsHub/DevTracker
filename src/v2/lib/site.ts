/**
 * Marketing / product site links used by landing chrome and footer.
 * Override social URLs with NEXT_PUBLIC_SOCIAL_* when you have real accounts.
 */

/** Brand / marketing home — always the public landing, even when signed in. */
export function siteHomeHref(_signedIn?: boolean) {
  return "/";
}

export function isMarketingHome(pathname: string) {
  return pathname === "/" || pathname === "/landing";
}

export type MarketingNavItem = {
  href: string;
  label: string;
  /** Path prefixes that mark this item active (besides href). */
  match?: string[];
};

/** Primary marketing nav — Home resolves per auth via siteHomeHref(). */
export const MARKETING_NAV: MarketingNavItem[] = [
  { href: "/contests", label: "Contests", match: ["/contests"] },
  { href: "/explore", label: "Explore", match: ["/explore", "/u/"] },
  { href: "/teams", label: "Teams", match: ["/teams"] },
  { href: "/leaderboard", label: "Leaderboard", match: ["/leaderboard"] },
];

export type SocialLink = {
  id: "github" | "linkedin" | "discord" | "email";
  label: string;
  href: string;
};

function envUrl(key: string, fallback: string) {
  if (typeof process === "undefined") return fallback;
  const v = process.env[key];
  return v && v.length > 0 ? v : fallback;
}

function contactEmailHref() {
  const raw = envUrl("NEXT_PUBLIC_SOCIAL_EMAIL", "atuldevac@gmail.com");
  return raw.startsWith("mailto:") ? raw : `mailto:${raw}`;
}

/** Product contact links (landing nav, footer, account sheet). */
export const SITE_SOCIAL: SocialLink[] = [
  {
    id: "github",
    label: "GitHub",
    href: envUrl(
      "NEXT_PUBLIC_SOCIAL_GITHUB",
      "https://github.com/AtulsHub",
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: envUrl(
      "NEXT_PUBLIC_SOCIAL_LINKEDIN",
      "https://www.linkedin.com/in/atul-sharma-82b0242a1",
    ),
  },
  {
    id: "discord",
    label: "Discord",
    // Prefer a profile/invite URL via env; default opens Discord with the handle in the fragment for copy.
    href: envUrl(
      "NEXT_PUBLIC_SOCIAL_DISCORD",
      "https://discord.com/users/1176014869909213234",
    ),
  },
  {
    id: "email",
    label: "Email",
    href: contactEmailHref(),
  },
];

export const SITE_FOOTER_LINKS = [
  { href: "/contests", label: "Contests" },
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/teams", label: "Teams" },
  { href: "/sign-in", label: "Sign in" },
  { href: "/sign-up", label: "Sign up" },
] as const;
