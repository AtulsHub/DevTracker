"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  ScrollText,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/v2/lib/cn";

const LINKS: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/teams", label: "Teams", icon: UsersRound },
  { href: "/admin/sync", label: "Sync", icon: Activity },
  { href: "/admin/audit", label: "Audit", icon: ScrollText },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav-rail" aria-label="Admin sections">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            data-active={active}
            className={cn(
              "admin-nav-item inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[var(--v2-text-sm)] font-medium no-underline transition-colors",
              active
                ? "text-[var(--v2-fg)]"
                : "text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]",
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
