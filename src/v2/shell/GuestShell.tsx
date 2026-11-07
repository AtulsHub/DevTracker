"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CircleUserRound,
  Compass,
  Home,
  Menu,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { UserAccountMenu } from "./UserAccountMenu";
import { MobileAccountSheet } from "./MobileAccountSheet";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/v2/lib/cn";
import { BrandLockup } from "@/v2/components/Brand";
import {
  MARKETING_NAV,
  SITE_SOCIAL,
  isMarketingHome,
  siteHomeHref,
} from "@/v2/lib/site";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M12 13.04 1.5 5.4V18.6c0 .99.81 1.8 1.8 1.8h4.2v-7.56L12 16.2l4.5-3.36V20.4h4.2c.99 0 1.8-.81 1.8-1.8V5.4L12 13.04z"
      />
      <path
        fill="#C5221F"
        d="M12 13.04 22.5 5.4V4.2c0-1.32-1.43-2.1-2.52-1.38L12 8.4 4.02 2.82C2.93 2.1 1.5 2.88 1.5 4.2v1.2L12 13.04z"
      />
      <path fill="#4285F4" d="M1.5 5.4v13.2c0 .99.81 1.8 1.8 1.8h4.2v-7.56L1.5 5.4z" />
      <path
        fill="#34A853"
        d="M16.5 12.84V20.4h4.2c.99 0 1.8-.81 1.8-1.8V5.4L16.5 12.84z"
      />
    </svg>
  );
}

function SocialIcon({ id, className }: { id: string; className?: string }) {
  if (id === "github") return <GithubIcon className={className} />;
  if (id === "x") return <XIcon className={className} />;
  if (id === "discord") return <DiscordIcon className={className} />;
  if (id === "email") return <GmailIcon className={className} />;
  return null;
}

const MOBILE_ICONS: Record<string, typeof Home> = {
  home: Home,
  "/contests": Calendar,
  "/explore": Compass,
  "/teams": Users,
};

function GuestTopBar({
  signedIn,
  userName,
  userEmail,
  userImage,
  onOpenAccount,
}: {
  signedIn: boolean;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  onOpenAccount: () => void;
}) {
  const pathname = usePathname();
  const { resolved, setTheme } = useTheme();
  const home = siteHomeHref(signedIn);

  return (
    <header
      className="guest-topbar sticky top-0 z-[var(--v2-z-nav)] flex h-[var(--v2-topbar-h)] items-center justify-between gap-3 border-b border-[var(--v2-border)] bg-[var(--v2-bg)]/85 px-4 backdrop-blur-md sm:px-6"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex min-w-0 items-center gap-4 lg:gap-6">
        <Link
          href={home}
          className="flex shrink-0 items-center no-underline"
          aria-label="DevTrack home"
        >
          <BrandLockup size="sm" />
        </Link>

        <nav
          className="hidden items-center gap-0.5 md:flex"
          aria-label="Marketing"
        >
          <Link
            href={home}
            className={cn(
              "rounded-[var(--v2-radius-md)] px-3 py-2 text-[var(--v2-text-sm)] font-medium no-underline transition-colors duration-[var(--v2-duration)]",
              isMarketingHome(pathname)
                ? "bg-[var(--v2-bg-muted)] text-[var(--v2-fg)]"
                : "text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]",
            )}
          >
            Home
          </Link>
          {MARKETING_NAV.map((l) => {
            const active = (l.match ?? [l.href]).some(
              (m) => pathname === m || (m !== "/" && pathname.startsWith(m)),
            );
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-[var(--v2-radius-md)] px-3 py-2 text-[var(--v2-text-sm)] font-medium no-underline transition-colors duration-[var(--v2-duration)]",
                  active
                    ? "bg-[var(--v2-bg-muted)] text-[var(--v2-fg)]"
                    : "text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <div className="mr-0.5 hidden items-center gap-0.5 lg:flex" aria-label="Contact us">
          {SITE_SOCIAL.map((s) => {
            const external = !s.href.startsWith("mailto:");
            return (
              <a
                key={s.id}
                href={s.href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                aria-label={s.label}
                className="flex size-9 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-muted)] transition-colors hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]"
              >
                <SocialIcon id={s.id} className="size-4" />
              </a>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Toggle theme"
          className="flex size-10 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-muted)] transition-colors hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)] sm:size-9"
          onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
        >
          {resolved === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </button>

        {signedIn ? <NotificationBell /> : null}

        {/* Phone: menu opens account sheet (logout / settings / socials) */}
        <button
          type="button"
          aria-label="Open menu"
          className="flex size-10 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-muted)] transition-colors hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)] sm:hidden"
          onClick={onOpenAccount}
        >
          {signedIn && userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImage}
              alt=""
              className="size-7 rounded-full object-cover ring-1 ring-[var(--v2-border)]"
            />
          ) : (
            <Menu className="size-5" />
          )}
        </button>

        {/* Tablet/desktop account controls */}
        <div className="hidden items-center gap-1.5 sm:flex">
          {signedIn ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex min-h-8 items-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] px-3 text-[var(--v2-text-sm)] font-semibold text-[var(--v2-on-primary)] no-underline transition-colors hover:bg-[var(--v2-primary-hover)]"
              >
                Open app
              </Link>
              <UserAccountMenu
                compact
                userName={userName}
                userEmail={userEmail}
                userImage={userImage}
              />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex min-h-8 items-center rounded-[var(--v2-radius-md)] px-3 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)] no-underline transition-colors hover:text-[var(--v2-fg)]"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex min-h-8 items-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] px-3 text-[var(--v2-text-sm)] font-semibold text-[var(--v2-on-primary)] no-underline transition-colors hover:bg-[var(--v2-primary-hover)]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function GuestBottomBar({
  signedIn,
  userImage,
  onOpenAccount,
  accountOpen,
}: {
  signedIn: boolean;
  userImage?: string | null;
  onOpenAccount: () => void;
  accountOpen: boolean;
}) {
  const pathname = usePathname();
  const home = siteHomeHref(signedIn);

  const items = [
    { href: home, label: "Home", iconKey: "home" },
    ...MARKETING_NAV.map((l) => ({
      href: l.href,
      label: l.label,
      iconKey: l.href,
    })),
  ].slice(0, 4);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--v2-z-nav)] border-t border-[var(--v2-border)] bg-[var(--v2-bg-elevated)]/95 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Browse"
    >
      <ul className="flex h-[var(--v2-bottom-nav-h)] items-stretch justify-around gap-0.5 px-1.5">
        {items.map((l) => {
          const active =
            l.iconKey === "home"
              ? isMarketingHome(pathname)
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
          const Icon = MOBILE_ICONS[l.iconKey] ?? Home;
          return (
            <li key={`${l.href}-${l.label}`} className="flex min-w-0 flex-1">
              <Link
                href={l.href}
                className={cn(
                  "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium no-underline transition-colors",
                  active ? "text-[var(--v2-primary)]" : "text-[var(--v2-fg-subtle)]",
                )}
              >
                <Icon
                  className="size-5"
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden
                />
                <span className="truncate">{l.label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={accountOpen}
            aria-haspopup="dialog"
            onClick={onOpenAccount}
            className={cn(
              "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors",
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
  );
}

export function GuestShell({
  children,
  signedIn = false,
  userName,
  userEmail,
  userImage,
}: {
  children: React.ReactNode;
  signedIn?: boolean;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}) {
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col bg-[var(--v2-bg)] text-[var(--v2-fg)]">
        <GuestTopBar
          signedIn={signedIn}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          onOpenAccount={() => setAccountOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden pb-[calc(var(--v2-bottom-nav-h)+env(safe-area-inset-bottom)+0.75rem)] sm:pb-8">
          {children}
        </main>
        <GuestBottomBar
          signedIn={signedIn}
          userImage={userImage}
          accountOpen={accountOpen}
          onOpenAccount={() => setAccountOpen(true)}
        />
        <MobileAccountSheet
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          signedIn={signedIn}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          variant="marketing"
        />
      </div>
    </ThemeProvider>
  );
}
