"use client";

import { useEffect } from "react";
import { cn } from "@/v2/lib/cn";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--v2-z-sheet)]" role="dialog" aria-modal>
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[var(--v2-radius-xl)] bg-[var(--v2-bg-elevated)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[var(--v2-shadow-lg)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--v2-radius-xl)]",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--v2-border)] sm:hidden" />
        {title ? (
          <h2 className="mb-3 text-[var(--v2-text-lg)] font-semibold text-[var(--v2-fg)]">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  );
}
