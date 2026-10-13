"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV, DESKTOP_EXTRA, isActive } from "./nav";
import { cn } from "@/v2/lib/cn";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun, Monitor } from "lucide-react";

export function Sidebar({
  signedIn,
  userName,
}: {
  signedIn: boolean;
  userName?: string | null;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const items = [...PRIMARY_NAV, ...DESKTOP_EXTRA];

  return (
    <>
      {/* Tablet icon rail */}
      <aside className="sticky top-0 z-[var(--v2-z-nav)] hidden h-dvh w-[var(--v2-rail-w)] shrink-0 flex-col border-r border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] md:flex lg:hidden">
        <Link
          href="/"
          className="flex h-14 items-center justify-center font-mono text-sm font-bold text-[var(--v2-primary)]"
        >
          DT
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-1 px-2" aria-label="Main">
          {items.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={cn(
                  "flex size-11 items-center justify-center rounded-[var(--v2-radius-md)]",
                  active
                    ? "bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
                    : "text-[var(--v2-fg-muted)] hover:bg-[var(--v2-bg-muted)]",
                )}
              >
                <Icon className="size-5" />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-[var(--v2-z-nav)] hidden h-dvh w-[var(--v2-sidebar-w)] shrink-0 flex-col border-r border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] lg:flex">
        <div className="px-5 py-5">
          <Link
            href="/"
            className="font-mono text-lg font-bold tracking-tight text-[var(--v2-primary)] no-underline"
          >
            DevTrack
          </Link>
          <p className="mt-1 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
            DSA · Contests · Teams
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Main">
          {items.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--v2-radius-md)] px-3 py-2.5 text-[var(--v2-text-sm)] font-medium no-underline transition-colors",
                  active
                    ? "bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
                    : "text-[var(--v2-fg-muted)] hover:bg-[var(--v2-bg-muted)] hover:text-[var(--v2-fg)]",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          {!signedIn ? (
            <Link
              href="/sign-in"
              className="mt-2 flex items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] px-3 py-2.5 text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg-inverse)] no-underline"
            >
              Sign in
            </Link>
          ) : null}
        </nav>

        <div className="border-t border-[var(--v2-border)] p-4">
          <div className="mb-3 flex gap-1">
            {(
              [
                ["light", Sun],
                ["dark", Moon],
                ["system", Monitor],
              ] as const
            ).map(([t, Icon]) => (
              <button
                key={t}
                type="button"
                aria-label={`${t} theme`}
                onClick={() => setTheme(t)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-[var(--v2-radius-sm)]",
                  theme === t
                    ? "bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
                    : "text-[var(--v2-fg-subtle)] hover:bg-[var(--v2-bg-muted)]",
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
          {signedIn && userName ? (
            <p className="truncate font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
              {userName}
            </p>
          ) : null}
        </div>
      </aside>
    </>
  );
}
