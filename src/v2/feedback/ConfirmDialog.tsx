"use client";

import { BottomSheet } from "@/v2/components/BottomSheet";
import { Button } from "@/v2/components/Button";

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {description ? (
        <p className="mb-5 text-[var(--v2-text-sm)] leading-relaxed text-[var(--v2-fg-muted)]">
          {description}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={danger ? "danger" : "primary"}
          loading={loading}
          className="w-full sm:w-auto"
          onClick={() => void onConfirm()}
        >
          {confirmLabel}
        </Button>
      </div>
    </BottomSheet>
  );
}
