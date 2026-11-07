"use client";

import { useCallback, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

export function useConfirm() {
  const [state, setState] = useState<
    (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  >(null);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const dialog = (
    <ConfirmDialog
      open={!!state}
      title={state?.title ?? ""}
      description={state?.description}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      danger={state?.danger}
      loading={loading}
      onClose={() => {
        state?.resolve(false);
        setState(null);
      }}
      onConfirm={async () => {
        setLoading(true);
        state?.resolve(true);
        setLoading(false);
        setState(null);
      }}
    />
  );

  return { confirm, dialog };
}
