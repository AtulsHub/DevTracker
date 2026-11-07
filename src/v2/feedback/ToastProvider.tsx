"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "@/v2/lib/cn";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
};

type ToastApi = {
  push: (toast: Omit<Toast, "id"> & { id?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id"> & { id?: string }) => {
      const id = toast.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, description) => push({ kind: "success", title, description }),
      error: (title, description) => push({ kind: "error", title, description }),
      info: (title, description) => push({ kind: "info", title, description }),
    }),
    [push],
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[calc(var(--v2-topbar-h)+0.5rem)] z-[var(--v2-z-toast)] flex flex-col items-end gap-2 px-3 sm:px-4"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--v2-radius-lg)] border px-3.5 py-3 shadow-[var(--v2-shadow-lg)]",
              t.kind === "success" &&
                "border-[color-mix(in_srgb,var(--v2-success)_35%,var(--v2-border))] bg-[var(--v2-bg-elevated)]",
              t.kind === "error" &&
                "border-[color-mix(in_srgb,var(--v2-danger)_40%,var(--v2-border))] bg-[var(--v2-bg-elevated)]",
              t.kind === "info" &&
                "border-[var(--v2-border)] bg-[var(--v2-bg-elevated)]",
            )}
          >
            {t.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--v2-success)]" />
            ) : t.kind === "error" ? (
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--v2-danger)]" />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0 text-[var(--v2-info)]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                {t.title}
              </p>
              {t.description ? (
                <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                  {t.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-subtle)] hover:bg-[var(--v2-surface-hover)]"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
