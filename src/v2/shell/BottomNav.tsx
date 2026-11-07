"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, LayoutDashboard } from "lucide-react";
import { PRIMARY_NAV, isActive, type NavItem } from "./nav";
import { MobileAccountSheet } from "./MobileAccountSheet";
import { cn } from "@/v2/lib/cn";

const OVERVIEW: NavItem = {
  href: "/dashboard",
  label: "Overview",
  icon: LayoutDashboard,
  match: ["/dashboard"],
  auth: "required",
};

export function BottomNav({
  signedIn,
  userName,
  userEmail,
  userImage,
}: {
  signedIn: boolean;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);

  // Keep phone bar to 4 destinations + Account (logout / settings live in the sheet).
  const items = signedIn
    ? [
        OVERVIEW,
        ...PRIMARY_NAV.filter(
          (i) =>
            i.href !== "/" &&
            i.href !== "/profile" &&
            i.auth !== "guest-profile",
        ),
      ].slice(0, 4)
    : PRIMARY_NAV.filter((i) => i.auth !== "required").slice(0, 4);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-[var(--v2-z-nav)] border-t border-[var(--v2-border)] bg-[var(--v2-bg-elevated)]/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <ul className="flex h-[var(--v2-bottom-nav-h)] items-stretch justify-around gap-0.5 px-1.5">
          {items.map((item) => {
            if (item.auth === "required" && !signedIn) return null;
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.label} className="flex min-w-0 flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 min-w-11 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors duration-[var(--v2-duration)]",
                    active
                      ? "text-[var(--v2-primary)]"
                      : "text-[var(--v2-fg-subtle)]",
                  )}
                >
                  <Icon
                    className="size-5"
                    strokeWidth={active ? 2.25 : 1.75}
                    aria-hidden
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex min-w-0 flex-1">
            <button
              type="button"
              aria-expanded={accountOpen}
              aria-haspopup="dialog"
              onClick={() => setAccountOpen(true)}
              className={cn(
                "flex min-h-12 min-w-11 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors duration-[var(--v2-duration)]",
                accountOpen
                  ? "text-[var(--v2-primary)]"
                  : "text-[var(--v2-fg-subtle)]",
              )}
            >
              {signedIn && userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userImage}
                  alt=""
                  className="size-5 rounded-full object-cover"
                />
              ) : (
                <CircleUserRound
                  className="size-5"
                  strokeWidth={accountOpen ? 2.25 : 1.75}
                  aria-hidden
                />
              )}
              <span className="truncate">You</span>
            </button>
          </li>
        </ul>
      </nav>

      <MobileAccountSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        signedIn={signedIn}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        variant="app"
      />
    </>
  );
}
