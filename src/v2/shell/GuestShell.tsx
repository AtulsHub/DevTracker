"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { cn } from "@/v2/lib/cn";
import { Moon, Sun } from "lucide-react";

const GUEST_LINKS = [
  { href: "/contests", label: "Contests" },
  { href: "/explore", label: "Explore" },
  { href: "/teams", label: "Teams" },
];

function GuestTopBar() {
  const pathname = usePathname();
  const { resolved, setTheme } = useTheme();
  const landing = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--v2-z-nav)] flex h-[var(--v2-topbar-h)] items-center justify-between gap-3 px-4 sm:px-6",
        landing
          ? "border-b border-transparent bg-transparent"
          : "border-b border-[var(--v2-border)] bg-[var(--v2-bg)]/90 backdrop-blur",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Link
        href="/"
        className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-[var(--v2-primary)] no-underline"
      >
        DevTrack
      </Link>
      <nav className="hidden items-center gap-1 sm:flex" aria-label="Browse">
        {GUEST_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-[var(--v2-radius-md)] px-3 py-2 text-[var(--v2-text-sm)] font-medium no-underline",
              pathname.startsWith(l.href)
                ? "text-[var(--v2-primary)]"
                : "text-[var(--v2-fg-muted)] hover:text-[var(--v2-fg)]",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Toggle theme"
          className="flex size-10 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-bg-muted)]"
          onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
        >
          {resolved === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </button>
        <Link
          href="/sign-in"
          className="hidden min-h-9 items-center rounded-[var(--v2-radius-md)] px-3 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)] no-underline sm:inline-flex"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="inline-flex min-h-9 items-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] px-3 text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg-inverse)] no-underline"
        >
          Sign up
        </Link>
      </div>
    </header>
  );
}

function GuestBottomBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--v2-z-nav)] flex h-[var(--v2-bottom-nav-h)] items-stretch justify-around border-t border-[var(--v2-border)] bg-[var(--v2-bg-elevated)]/95 px-1 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Browse"
    >
      {[
        { href: "/", label: "Home" },
        ...GUEST_LINKS,
        { href: "/sign-up", label: "Sign up" },
      ].map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "flex min-h-11 flex-1 flex-col items-center justify-center text-[10px] font-medium no-underline",
            (l.href === "/" ? pathname === "/" : pathname.startsWith(l.href))
              ? "text-[var(--v2-primary)]"
              : "text-[var(--v2-fg-subtle)]",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function GuestShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col bg-[var(--v2-bg)] text-[var(--v2-fg)]">
        <GuestTopBar />
        <main className="flex-1 overflow-x-hidden pb-[calc(var(--v2-bottom-nav-h)+env(safe-area-inset-bottom)+0.75rem)] sm:pb-6">
          {children}
        </main>
        <GuestBottomBar />
      </div>
    </ThemeProvider>
  );
}
