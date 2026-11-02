"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronUp, LogOut, Settings, User } from "lucide-react";
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

export function UserAccountMenu({
  userName,
  userEmail,
  userImage,
  compact = false,
}: {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const display = userName ?? userEmail ?? "Account";

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[var(--v2-radius-md)] text-left transition-colors duration-[var(--v2-duration)]",
          compact
            ? "justify-center p-2 hover:bg-[var(--v2-surface-hover)]"
            : "px-2 py-2 hover:bg-[var(--v2-surface-hover)]",
        )}
      >
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userImage}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--v2-primary-muted)] font-mono text-[11px] font-semibold text-[var(--v2-primary)]">
            {initials(display)}
          </span>
        )}
        {!compact ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
                {display}
              </span>
              {userEmail && userName ? (
                <span className="block truncate text-[11px] text-[var(--v2-fg-subtle)]">
                  {userEmail}
                </span>
              ) : null}
            </span>
            <ChevronUp
              className={cn(
                "size-3.5 shrink-0 text-[var(--v2-fg-subtle)] transition-transform duration-[var(--v2-duration)]",
                !open && "rotate-180",
              )}
              aria-hidden
            />
          </>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-[var(--v2-z-sheet)] min-w-[200px] overflow-hidden rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] py-1 shadow-[var(--v2-shadow-lg)]",
            compact ? "bottom-full left-1/2 mb-2 -translate-x-1/2" : "bottom-full left-0 right-0 mb-2",
          )}
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)] no-underline hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]"
          >
            <User className="size-4" aria-hidden />
            Profile
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)] no-underline hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]"
          >
            <Settings className="size-4" aria-hidden />
            Settings
          </Link>
          <div className="my-1 h-px bg-[var(--v2-border)]" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[var(--v2-text-sm)] text-[var(--v2-danger)] hover:bg-[var(--v2-surface-hover)]"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
