"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV, isActive } from "./nav";
import { cn } from "@/v2/lib/cn";

export function BottomNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--v2-z-nav)] border-t border-[var(--v2-border)] bg-[var(--v2-bg-elevated)]/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="flex h-[var(--v2-bottom-nav-h)] items-stretch justify-around px-1">
        {PRIMARY_NAV.map((item) => {
          if (item.auth === "required" && !signedIn) return null;
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.label} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  active
                    ? "text-[var(--v2-primary)]"
                    : "text-[var(--v2-fg-subtle)]",
                )}
              >
                <Icon
                  className="size-5"
                  strokeWidth={active ? 2.4 : 1.8}
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
