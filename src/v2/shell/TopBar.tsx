"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { PRIMARY_NAV, isActive } from "./nav";
import { cn } from "@/v2/lib/cn";

function titleFor(pathname: string) {
  for (const item of PRIMARY_NAV) {
    if (isActive(pathname, item)) return item.label;
  }
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/sign-")) return "Account";
  if (pathname.startsWith("/u/")) return "Profile";
  if (pathname.startsWith("/onboarding")) return "Welcome";
  return "DevTrack";
}

export function TopBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const landingGuest = pathname === "/" && !signedIn;

  return (
    <header
      className={cn(
        "v2-topbar sticky top-0 z-[var(--v2-z-nav)] flex h-[var(--v2-topbar-h)] items-center justify-between px-4 md:px-6",
        landingGuest
          ? "border-b border-transparent bg-transparent"
          : "border-b border-[var(--v2-border)] bg-[var(--v2-bg)]/90 backdrop-blur",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-sm font-bold tracking-tight text-[var(--v2-primary)] no-underline md:hidden"
        >
          DevTrack
        </Link>
        <h1
          className={cn(
            "v2-topbar-title hidden text-[var(--v2-text-base)] font-semibold text-[var(--v2-fg)] md:block",
            landingGuest && "opacity-0",
          )}
        >
          {titleFor(pathname)}
        </h1>
        <h1
          className={cn(
            "v2-topbar-title text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)] md:hidden",
            landingGuest && "sr-only",
          )}
        >
          {titleFor(pathname)}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/explore"
          aria-label="Search"
          className="flex size-11 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-bg-muted)]"
        >
          <Search className="size-5" />
        </Link>
        {!signedIn ? (
          <Link
            href="/sign-in"
            className="hidden min-h-9 items-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] px-3 text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg-inverse)] no-underline sm:inline-flex"
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </header>
  );
}
