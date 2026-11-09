"use client";

import type { ReactNode } from "react";
import { Shield } from "lucide-react";
import { AdminNav } from "@/v2/components/admin/AdminNav";
import { cn } from "@/v2/lib/cn";

export function AdminShell({
  title,
  eyebrow = "Control room",
  actions,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "admin-console mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7",
        className,
      )}
    >
      <header className="admin-hero admin-in relative mb-5 px-4 py-5 sm:px-6 sm:py-6">
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--admin-teal)_80%,var(--v2-fg))]">
              <Shield className="size-3.5" aria-hidden />
              {eyebrow}
            </p>
            <h1 className="mt-1.5 text-[1.75rem] font-semibold tracking-tight text-[var(--v2-fg)] sm:text-[2rem]">
              {title}
            </h1>
          </div>
          {actions ? (
            <div className="relative z-[1] flex flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      </header>

      <div className="admin-in admin-in-delay-1 mb-5">
        <AdminNav />
      </div>

      <div className="admin-in admin-in-delay-2">{children}</div>
    </div>
  );
}

export function AdminError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mb-4 rounded-[var(--v2-radius-md)] border border-[var(--admin-rose)]/25 bg-[var(--admin-rose-soft)] px-3 py-2 text-[var(--v2-text-sm)] text-[var(--admin-rose)]"
    >
      {message}
    </p>
  );
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 py-10 text-center text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
      {children}
    </p>
  );
}

export function relativeTime(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diff = Date.now() - t;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}
