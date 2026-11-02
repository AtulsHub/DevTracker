"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { PRIMARY_NAV, isActive, type NavItem } from "./nav";
import { cn } from "@/v2/lib/cn";

const OVERVIEW: NavItem = {
  href: "/dashboard",
  label: "Overview",
  icon: LayoutDashboard,
  match: ["/dashboard"],
  auth: "required",
};

export function BottomNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const items = signedIn
    ? [OVERVIEW, ...PRIMARY_NAV.filter((i) => i.href !== "/")]
    : PRIMARY_NAV.filter((i) => i.auth !== "required");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--v2-z-nav)] border-t border-[var(--v2-border)] bg-[var(--v2-bg-elevated)]/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="flex h-[var(--v2-bottom-nav-h)] items-stretch justify-around px-1">
        {items.map((item) => {
          if (item.auth === "required" && !signedIn) return null;
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.label} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-[var(--v2-duration)]",
                  active
                    ? "text-[var(--v2-primary)]"
                    : "text-[var(--v2-fg-subtle)]",
                )}
              >
                <Icon
                  className="size-[18px]"
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
