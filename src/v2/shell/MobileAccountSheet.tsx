"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Settings,
  Shield,
  UserRound,
  X,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { SITE_SOCIAL } from "@/v2/lib/site";
import { cn } from "@/v2/lib/cn";

function initials(name?: string | null) {
  if (!name) return "?";
  const part = name.split("@")[0] ?? name;
  const bits = part.trim().split(/\s+/).filter(Boolean);
  if (bits.length >= 2) {
    return `${bits[0]![0]}${bits[1]![0]}`.toUpperCase();
  }
  return part.slice(0, 2).toUpperCase();
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
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
  if (id === "linkedin") return <LinkedInIcon className={className} />;
  if (id === "discord") return <DiscordIcon className={className} />;
  if (id === "email") return <GmailIcon className={className} />;
  return null;
}

export function MobileAccountSheet({
  open,
  onClose,
  signedIn,
  isAdmin = false,
  userName,
  userEmail,
  userImage,
  variant = "app",
}: {
  open: boolean;
  onClose: () => void;
  signedIn: boolean;
  isAdmin?: boolean;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  /** app = in-product; marketing = landing chrome */
  variant?: "app" | "marketing";
}) {
  const { theme, setTheme, resolved } = useTheme();
  const display = userName ?? userEmail ?? "Account";
  const pathname = usePathname();
  const pathWhenOpened = useRef<string | null>(null);
  const pushedHistory = useRef(false);

  // Close when the route changes underneath (link nav / soft navigate).
  useEffect(() => {
    if (!open) {
      pathWhenOpened.current = null;
      return;
    }
    if (pathWhenOpened.current == null) {
      pathWhenOpened.current = pathname;
      return;
    }
    if (pathname !== pathWhenOpened.current) {
      onClose();
    }
  }, [pathname, open, onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    // So browser / gesture back dismisses the sheet instead of only changing the page under it.
    try {
      window.history.pushState({ v2AccountSheet: true }, "");
      pushedHistory.current = true;
    } catch {
      pushedHistory.current = false;
    }
    function onPop() {
      pushedHistory.current = false;
      onClose();
    }
    window.addEventListener("popstate", onPop);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [open, onClose]);

  /** Close without touching history (link navigation). */
  function closeSheet() {
    pushedHistory.current = false;
    onClose();
  }

  /** Backdrop / X / Escape — prefer history.back so Android back matches. */
  function dismiss() {
    if (
      pushedHistory.current &&
      typeof window !== "undefined" &&
      (window.history.state as { v2AccountSheet?: boolean } | null)?.v2AccountSheet
    ) {
      pushedHistory.current = false;
      window.history.back();
      return;
    }
    closeSheet();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--v2-z-sheet)] md:hidden" role="presentation">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--v2-fg)_28%,transparent)]"
        onClick={dismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className="absolute inset-x-0 bottom-0 max-h-[min(88dvh,640px)] overflow-y-auto rounded-t-[var(--v2-radius-xl)] border border-b-0 border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] shadow-[var(--v2-shadow-lg)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <span className="mx-auto h-1 w-10 rounded-full bg-[var(--v2-border-strong)]" />
          <button
            type="button"
            aria-label="Close"
            onClick={dismiss}
            className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)]"
          >
            <X className="size-5" />
          </button>
        </div>

        {signedIn ? (
          <div className="flex items-center gap-3 px-5 pb-4 pt-1">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt=""
                className="size-12 shrink-0 rounded-full object-cover ring-1 ring-[var(--v2-border)]"
              />
            ) : (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--v2-primary-muted)] font-mono text-sm font-semibold text-[var(--v2-primary)] ring-1 ring-[var(--v2-border)]">
                {initials(display)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[var(--v2-text-base)] font-semibold text-[var(--v2-fg)]">
                {display}
              </p>
              {userEmail ? (
                <p className="truncate text-[var(--v2-text-sm)] text-[var(--v2-fg-subtle)]">
                  {userEmail}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="px-5 pb-3 pt-1">
            <p className="text-[var(--v2-text-base)] font-semibold text-[var(--v2-fg)]">
              Account
            </p>
            <p className="mt-0.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              Sign in to sync platforms and teams.
            </p>
          </div>
        )}

        <div className="space-y-1 border-t border-[var(--v2-border)] px-3 py-3">
          {signedIn ? (
            <>
              {variant === "marketing" ? (
                <SheetLink
                  href="/dashboard"
                  icon={LayoutDashboard}
                  onClick={closeSheet}
                >
                  Open app
                </SheetLink>
              ) : null}
              <SheetLink href="/profile" icon={UserRound} onClick={closeSheet}>
                Edit profile
              </SheetLink>
              <SheetLink href="/settings" icon={Settings} onClick={closeSheet}>
                Settings
              </SheetLink>
              {isAdmin ? (
                <SheetLink href="/admin" icon={Shield} onClick={closeSheet}>
                  Admin
                </SheetLink>
              ) : null}
              <SheetLink href="/landing" icon={LayoutTemplate} onClick={closeSheet}>
                Landing page
              </SheetLink>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                onClick={onClose}
                className="flex min-h-12 items-center justify-center rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)] no-underline"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={onClose}
                className="v2-btn-primary flex min-h-12 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] text-[var(--v2-text-sm)] font-semibold no-underline"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <div className="border-t border-[var(--v2-border)] px-5 py-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--v2-fg-subtle)]">
            Theme
          </p>
          <div className="flex gap-1 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] p-1">
            {(
              [
                ["light", "Light"],
                ["dark", "Dark"],
                ["system", "System"],
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={cn(
                  "min-h-10 flex-1 rounded-[6px] text-[var(--v2-text-sm)] font-medium transition-colors",
                  theme === t
                    ? "bg-[var(--v2-bg-muted)] text-[var(--v2-fg)]"
                    : "text-[var(--v2-fg-muted)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[var(--v2-fg-subtle)]">
            Active: {resolved}
          </p>
        </div>

        <div className="border-t border-[var(--v2-border)] px-5 py-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--v2-fg-subtle)]">
            Contact us
          </p>
          <p className="mb-3 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Reach the DevTrack team on these channels.
          </p>
          <div className="flex gap-2">
            {SITE_SOCIAL.map((s) => {
              const external = !s.href.startsWith("mailto:");
              return (
                <a
                  key={s.id}
                  href={s.href}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  aria-label={
                    s.id === "discord"
                      ? "Discord atul0674 — contact us"
                      : `${s.label} — contact us`
                  }
                  className="flex size-11 flex-1 items-center justify-center rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]"
                >
                  <SocialIcon id={s.id} className="size-5" />
                </a>
              );
            })}
          </div>
        </div>

        {signedIn ? (
          <div className="border-t border-[var(--v2-border)] px-3 py-3">
            <button
              type="button"
              onClick={() => {
                closeSheet();
                void signOut({ callbackUrl: "/" });
              }}
              className="flex min-h-12 w-full items-center gap-3 rounded-[var(--v2-radius-md)] px-3 text-left text-[var(--v2-text-sm)] font-semibold text-[var(--v2-danger)] hover:bg-[var(--v2-surface-hover)]"
            >
              <LogOut className="size-5 shrink-0" aria-hidden />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SheetLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-12 items-center gap-3 rounded-[var(--v2-radius-md)] px-3 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)] no-underline hover:bg-[var(--v2-surface-hover)]"
    >
      <Icon className="size-5 shrink-0 text-[var(--v2-fg-muted)]" aria-hidden />
      {children}
    </Link>
  );
}
