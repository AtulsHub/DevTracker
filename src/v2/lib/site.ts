/**
 * Marketing / product site links used by landing chrome and footer.
 * Override social URLs with NEXT_PUBLIC_SOCIAL_* when you have real accounts.
 */

export function siteHomeHref(signedIn: boolean) {
  return signedIn ? "/landing" : "/";
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
];

export type SocialLink = {
  id: "github" | "x" | "discord";
  label: string;
  href: string;
};

function envUrl(key: string, fallback: string) {
  if (typeof process === "undefined") return fallback;
  const v = process.env[key];
  return v && v.length > 0 ? v : fallback;
}

/** Product social links (shown in landing nav + footer). */
export const SITE_SOCIAL: SocialLink[] = [
  {
    id: "github",
    label: "GitHub",
    href: envUrl("NEXT_PUBLIC_SOCIAL_GITHUB", "https://github.com"),
  },
  {
    id: "x",
    label: "X",
    href: envUrl("NEXT_PUBLIC_SOCIAL_X", "https://x.com"),
  },
  {
    id: "discord",
    label: "Discord",
    href: envUrl("NEXT_PUBLIC_SOCIAL_DISCORD", "https://discord.com"),
  },
];

export const SITE_FOOTER_LINKS = [
  { href: "/contests", label: "Contests" },
  { href: "/explore", label: "Explore" },
  { href: "/teams", label: "Teams" },
  { href: "/sign-in", label: "Sign in" },
  { href: "/sign-up", label: "Sign up" },
] as const;
