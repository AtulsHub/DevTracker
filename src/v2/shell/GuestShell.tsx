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

function GuestTopBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const { resolved, setTheme } = useTheme();

  return (
    <header
      className="guest-topbar sticky top-0 z-[var(--v2-z-nav)] flex h-[var(--v2-topbar-h)] items-center justify-between gap-3 border-b border-[var(--v2-border)] bg-[var(--v2-bg)]/85 px-4 backdrop-blur-md sm:px-6"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Link
        href={signedIn ? "/dashboard" : "/"}
        className="flex items-center gap-2.5 no-underline"
      >
        <span className="flex size-7 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] font-mono text-[10px] font-bold text-white">
          DT
        </span>
        <span className="text-[var(--v2-text-sm)] font-semibold tracking-tight text-[var(--v2-fg)]">
          DevTrack
        </span>
      </Link>
      <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Browse">
        {GUEST_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-[var(--v2-radius-md)] px-3 py-2 text-[var(--v2-text-sm)] font-medium no-underline transition-colors duration-[var(--v2-duration)]",
              pathname.startsWith(l.href)
                ? "bg-[var(--v2-bg-muted)] text-[var(--v2-fg)]"
                : "text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Toggle theme"
          className="flex size-9 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-muted)] transition-colors hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]"
          onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
        >
          {resolved === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </button>
        {signedIn ? (
          <Link
            href="/dashboard"
            className="inline-flex min-h-8 items-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] px-3 text-[var(--v2-text-sm)] font-semibold text-white no-underline transition-colors hover:bg-[var(--v2-primary-hover)]"
          >
            Open app
          </Link>
        ) : (
          <>
            <Link
              href="/sign-in"
              className="hidden min-h-8 items-center rounded-[var(--v2-radius-md)] px-3 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)] no-underline transition-colors hover:text-[var(--v2-fg)] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex min-h-8 items-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] px-3 text-[var(--v2-text-sm)] font-semibold text-white no-underline transition-colors hover:bg-[var(--v2-primary-hover)]"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

function GuestBottomBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const items = signedIn
    ? [
        { href: "/landing", label: "Home" },
        ...GUEST_LINKS,
        { href: "/dashboard", label: "App" },
      ]
    : [
        { href: "/", label: "Home" },
        ...GUEST_LINKS,
        { href: "/sign-up", label: "Sign up" },
      ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--v2-z-nav)] flex h-[var(--v2-bottom-nav-h)] items-stretch justify-around border-t border-[var(--v2-border)] bg-[var(--v2-bg-elevated)]/95 px-1 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Browse"
    >
      {items.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "flex min-h-11 flex-1 flex-col items-center justify-center text-[10px] font-medium no-underline transition-colors",
            (l.href === "/" || l.href === "/landing"
              ? pathname === l.href
              : pathname.startsWith(l.href))
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

export function GuestShell({
  children,
  signedIn = false,
}: {
  children: React.ReactNode;
  signedIn?: boolean;
}) {
  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col bg-[var(--v2-bg)] text-[var(--v2-fg)]">
        <GuestTopBar signedIn={signedIn} />
        <main className="flex-1 overflow-x-hidden pb-[calc(var(--v2-bottom-nav-h)+env(safe-area-inset-bottom)+0.75rem)] sm:pb-8">
          {children}
        </main>
        <GuestBottomBar signedIn={signedIn} />
      </div>
    </ThemeProvider>
  );
}
