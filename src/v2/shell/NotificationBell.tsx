"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { v2Api, type NotificationDto } from "@/v2/lib/api";
import { cn } from "@/v2/lib/cn";

function labelFor(n: NotificationDto) {
  const p = (n.payload ?? {}) as Record<string, unknown>;
  const team = typeof p.teamName === "string" ? p.teamName : "a team";
  switch (n.type) {
    case "team_added":
      return `You were added to ${team}`;
    case "team_invited":
      return `Invite to join ${team}`;
    case "team_join_approved":
      return `Your request for ${team} was approved`;
    case "team_join_request":
      return `${typeof p.requester === "string" ? p.requester : "Someone"} asked to join ${team}`;
    case "contest_reminder": {
      const name =
        typeof p.contestName === "string" ? p.contestName : "A contest";
      return `${name} starts in about an hour`;
    }
    default:
      return "New notification";
  }
}

function hrefFor(n: NotificationDto) {
  const p = (n.payload ?? {}) as Record<string, unknown>;
  return typeof p.href === "string" ? p.href : "/";
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await v2Api.notifications();
      setItems(res.notifications);
      setUnread(res.unread);
    } catch {
      /* ignore when signed out mid-flight */
    }
  }, []);

  // Fetch once on mount + when tab focuses. No 60s polling (was wasting requests).
  useEffect(() => {
    void refresh();
    function onFocus() {
      void refresh();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function openPanel() {
    setOpen((v) => !v);
    if (!open) {
      await refresh();
      if (unread > 0) {
        try {
          await v2Api.markAllNotificationsRead();
          setUnread(0);
          setItems((prev) =>
            prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
          );
        } catch {
          /* ignore */
        }
      }
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
        onClick={() => void openPanel()}
        className="relative flex size-10 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-muted)] transition-colors hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)] sm:size-9"
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[var(--v2-danger)]" />
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-[var(--v2-z-sheet)] mt-2 w-[min(100vw-1.5rem,320px)] overflow-hidden rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] shadow-[var(--v2-shadow-lg)]"
        >
          <div className="border-b border-[var(--v2-border)] px-3.5 py-2.5">
            <p className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              Notifications
            </p>
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.length === 0 ? (
              <li className="px-3.5 py-6 text-center text-[var(--v2-text-sm)] text-[var(--v2-fg-subtle)]">
                You’re all caught up.
              </li>
            ) : (
              items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={hrefFor(n)}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block px-3.5 py-2.5 no-underline transition-colors hover:bg-[var(--v2-surface-hover)]",
                      !n.readAt && "bg-[var(--v2-primary-muted)]/40",
                    )}
                  >
                    <p className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
                      {labelFor(n)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--v2-fg-subtle)]">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
