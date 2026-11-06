import {
  Home,
  Calendar,
  Compass,
  Users,
  User,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: string[];
  auth?: "any" | "required" | "guest-profile";
};

/** Bottom nav (mobile) destinations */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home, match: ["/"], auth: "any" },
  {
    href: "/contests",
    label: "Contests",
    icon: Calendar,
    match: ["/contests"],
    auth: "any",
  },
  {
    href: "/explore",
    label: "Explore",
    icon: Compass,
    match: ["/explore", "/u/"],
    auth: "any",
  },
  {
    href: "/teams",
    label: "Teams",
    icon: Users,
    match: ["/teams"],
    auth: "any",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    match: ["/profile"],
    auth: "required",
  },
];

/** Desktop sidebar — workspace section */
export const WORKSPACE_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    match: ["/dashboard"],
    auth: "required",
  },
  { href: "/", label: "Home", icon: Home, match: ["/"], auth: "any" },
  {
    href: "/contests",
    label: "Contests",
    icon: Calendar,
    match: ["/contests"],
    auth: "any",
  },
  {
    href: "/explore",
    label: "Explore",
    icon: Compass,
    match: ["/explore", "/u/"],
    auth: "any",
  },
  {
    href: "/teams",
    label: "Teams",
    icon: Users,
    match: ["/teams"],
    auth: "any",
  },
];

/**
 * Profile + Settings live under the account menu (sidebar footer),
 * not as duplicate sidebar links.
 */
export const MANAGEMENT_NAV: NavItem[] = [];

/** @deprecated Prefer WORKSPACE_NAV on desktop */
export const DESKTOP_EXTRA: NavItem[] = [
  ...WORKSPACE_NAV.filter((i) => i.href === "/dashboard"),
];

export function isActive(pathname: string, item: NavItem) {
  if (item.href === "/") return pathname === "/";
  return item.match.some(
    (m) => pathname === m || (m !== "/" && pathname.startsWith(m)),
  );
}
