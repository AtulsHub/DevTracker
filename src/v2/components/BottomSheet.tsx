"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/v2/lib/cn";
import { X } from "lucide-react";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const wasOpen = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // Focus once when the sheet opens — not on every parent re-render
    // (inline onClose would otherwise steal focus and hide the mobile keyboard).
    const justOpened = !wasOpen.current;
    wasOpen.current = true;
    let t = 0;
    if (justOpened) {
      t = window.setTimeout(() => {
        const root = panelRef.current;
        if (!root) return;
        const active = document.activeElement;
        if (active && root.contains(active)) return;
        const field = root.querySelector<HTMLElement>(
          "input, textarea, select",
        );
        (field ??
          root.querySelector<HTMLElement>(
            'button:not([aria-label="Close"]), [href], [tabindex]:not([tabindex="-1"])',
          ))?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (t) window.clearTimeout(t);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--v2-z-sheet)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[var(--v2-radius-xl)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[var(--v2-shadow-lg)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--v2-radius-xl)]",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--v2-border)] sm:hidden" />
        {title ? (
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2
              id={titleId}
              className="text-[var(--v2-text-base)] font-semibold text-[var(--v2-fg)]"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-8 shrink-0 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-subtle)] transition-colors hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
