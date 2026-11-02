"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  WORKSPACE_NAV,
  MANAGEMENT_NAV,
  isActive,
  type NavItem,
} from "./nav";
import { cn } from "@/v2/lib/cn";
import { useTheme } from "./ThemeProvider";
import { UserAccountMenu } from "./UserAccountMenu";
import { Moon, Sun, Monitor } from "lucide-react";

function NavLink({
  item,
  pathname,
  compact,
}: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
}) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={compact ? item.label : undefined}
      aria-label={compact ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center rounded-[var(--v2-radius-md)] text-[var(--v2-text-sm)] font-medium no-underline transition-colors duration-[var(--v2-duration)]",
        compact
          ? "size-10 justify-center"
          : "gap-2.5 px-2.5 py-2",
        active
          ? "bg-[var(--v2-bg-muted)] text-[var(--v2-fg)]"
          : "text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]",
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          active ? "text-[var(--v2-primary)]" : "text-current",
        )}
        aria-hidden
      />
      {!compact ? item.label : null}
      {!compact && active ? (
        <span className="ml-auto size-1.5 rounded-full bg-[var(--v2-primary)]" />
      ) : null}
    </Link>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="mb-2 flex gap-0.5 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] p-0.5">
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
          aria-pressed={theme === t}
          onClick={() => setTheme(t)}
          className={cn(
            "flex h-7 flex-1 items-center justify-center rounded-[6px] transition-colors duration-[var(--v2-duration)]",
            theme === t
              ? "bg-[var(--v2-bg-muted)] text-[var(--v2-fg)]"
              : "text-[var(--v2-fg-subtle)] hover:text-[var(--v2-fg)]",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

export function Sidebar({
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
  const workspace = WORKSPACE_NAV.filter(
    (i) => !(i.auth === "required" && !signedIn),
  );
  const management = MANAGEMENT_NAV.filter(
    (i) => !(i.auth === "required" && !signedIn),
  );
  const railItems = [...workspace, ...management];

  return (
    <>
      {/* Tablet icon rail */}
      <aside className="sticky top-0 z-[var(--v2-z-nav)] hidden h-dvh w-[var(--v2-rail-w)] shrink-0 flex-col border-r border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] md:flex lg:hidden">
        <Link
          href={signedIn ? "/dashboard" : "/"}
          className="flex h-[var(--v2-topbar-h)] items-center justify-center font-mono text-sm font-bold text-[var(--v2-primary)] no-underline"
        >
          DT
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-1 px-2 py-2" aria-label="Main">
          {railItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} compact />
          ))}
        </nav>
        {signedIn ? (
          <div className="border-t border-[var(--v2-border)] p-2">
            <UserAccountMenu
              compact
              userName={userName}
              userEmail={userEmail}
              userImage={userImage}
            />
          </div>
        ) : null}
      </aside>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-[var(--v2-z-nav)] hidden h-dvh w-[var(--v2-sidebar-w)] shrink-0 flex-col border-r border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] lg:flex">
        <div className="flex h-[var(--v2-topbar-h)] items-center px-4">
          <Link
            href={signedIn ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 no-underline"
          >
            <span className="flex size-7 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] font-mono text-[11px] font-bold text-white">
              DT
            </span>
            <span className="text-[var(--v2-text-base)] font-semibold tracking-tight text-[var(--v2-fg)]">
              DevTrack
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-3" aria-label="Main">
          <div>
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--v2-fg-subtle)]">
              Workspace
            </p>
            <div className="flex flex-col gap-0.5">
              {workspace.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>

          {management.length > 0 ? (
            <div>
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--v2-fg-subtle)]">
                Management
              </p>
              <div className="flex flex-col gap-0.5">
                {management.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ) : null}

          {!signedIn ? (
            <Link
              href="/sign-in"
              className="mt-1 flex items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] px-3 py-2 text-[var(--v2-text-sm)] font-semibold text-white no-underline transition-colors hover:bg-[var(--v2-primary-hover)]"
            >
              Sign in
            </Link>
          ) : null}
        </nav>

        <div className="border-t border-[var(--v2-border)] p-3">
          <ThemeToggle />
          {signedIn ? (
            <UserAccountMenu
              userName={userName}
              userEmail={userEmail}
              userImage={userImage}
            />
          ) : null}
        </div>
      </aside>
    </>
  );
}
