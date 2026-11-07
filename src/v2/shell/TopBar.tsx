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
import { isMarketingHome, siteHomeHref } from "@/v2/lib/site";
import { cn } from "@/v2/lib/cn";
import { BrandLockup } from "@/v2/components/Brand";
import { NotificationBell } from "./NotificationBell";

function titleFor(pathname: string) {
  for (const item of [...WORKSPACE_NAV, ...MANAGEMENT_NAV, ...PRIMARY_NAV]) {
    if (isActive(pathname, item)) return item.label;
  }
  if (pathname.startsWith("/dashboard/submissions")) return "Submissions";
  if (pathname.startsWith("/dashboard")) return "Overview";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/sign-")) return "Account";
  if (pathname.startsWith("/u/")) return "Profile";
  if (pathname.startsWith("/onboarding")) return "Welcome";
  if (pathname.startsWith("/home")) return "Today";
  return "DevTrack";
}

export function TopBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const onLanding = isMarketingHome(pathname);

  return (
    <header
      className={cn(
        "v2-topbar sticky top-0 z-[var(--v2-z-nav)] flex h-[var(--v2-topbar-h)] items-center justify-between gap-3 px-4 md:px-6",
        onLanding
          ? "border-b border-transparent bg-transparent"
          : "border-b border-[var(--v2-border)] bg-[color-mix(in_srgb,var(--v2-bg-elevated)_78%,transparent)] backdrop-blur-md",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={siteHomeHref(signedIn)}
          className="flex items-center no-underline md:hidden"
          aria-label="DevTrack home"
        >
          <BrandLockup size="sm" />
        </Link>
        <h1
          className={cn(
            "v2-topbar-title truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)]",
            "hidden md:block",
            onLanding && "opacity-0",
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
        {signedIn ? <NotificationBell /> : null}
        {!signedIn ? (
          <Link
            href="/sign-in"
            className="v2-btn-primary hidden min-h-8 items-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] px-3 text-[var(--v2-text-sm)] font-semibold no-underline transition-colors hover:bg-[var(--v2-primary-hover)] sm:inline-flex"
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </header>
  );
}
