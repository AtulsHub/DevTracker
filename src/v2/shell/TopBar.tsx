"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import {
  PRIMARY_NAV,
  WORKSPACE_NAV,
  MANAGEMENT_NAV,
  isActive,
} from "./nav";
import { cn } from "@/v2/lib/cn";

function titleFor(pathname: string) {
  for (const item of [...WORKSPACE_NAV, ...MANAGEMENT_NAV, ...PRIMARY_NAV]) {
    if (isActive(pathname, item)) return item.label;
  }
  if (pathname.startsWith("/dashboard")) return "Overview";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/sign-")) return "Account";
  if (pathname.startsWith("/u/")) return "Profile";
  if (pathname.startsWith("/onboarding")) return "Welcome";
  if (pathname.startsWith("/activity")) return "Activity";
  return "DevTrack";
}

export function TopBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const landingGuest = pathname === "/" && !signedIn;

  return (
    <header
      className={cn(
        "v2-topbar sticky top-0 z-[var(--v2-z-nav)] flex h-[var(--v2-topbar-h)] items-center justify-between gap-3 px-4 md:px-6",
        landingGuest
          ? "border-b border-transparent bg-transparent"
          : "border-b border-[var(--v2-border)] bg-[var(--v2-bg)]/85 backdrop-blur-md",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={signedIn ? "/dashboard" : "/"}
          className="flex items-center gap-2 no-underline md:hidden"
        >
          <span className="flex size-7 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] font-mono text-[10px] font-bold text-white">
            DT
          </span>
          <span className="text-[var(--v2-text-sm)] font-semibold tracking-tight text-[var(--v2-fg)]">
            DevTrack
          </span>
        </Link>
        <h1
          className={cn(
            "v2-topbar-title truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)]",
            "hidden md:block",
            landingGuest && "opacity-0",
          )}
        >
          {titleFor(pathname)}
        </h1>
      </div>
      <div className="flex items-center gap-1.5">
        <Link
          href="/explore"
          aria-label="Search explorers"
          className="flex size-9 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-muted)] transition-colors duration-[var(--v2-duration)] hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]"
        >
          <Search className="size-4" />
        </Link>
        {!signedIn ? (
          <Link
            href="/sign-in"
            className="hidden min-h-8 items-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] px-3 text-[var(--v2-text-sm)] font-semibold text-white no-underline transition-colors hover:bg-[var(--v2-primary-hover)] sm:inline-flex"
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </header>
  );
}
