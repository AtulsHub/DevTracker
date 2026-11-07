"use client";

import { ToastProvider } from "./ToastProvider";

export function FeedbackProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
