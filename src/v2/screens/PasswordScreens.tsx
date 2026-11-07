"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { v2Api } from "@/v2/lib/api";

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await v2Api.forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={done ? "Check your email" : "Forgot password"}
      subtitle={
        done
          ? "If that account uses email/password, a reset link is on its way."
          : "We’ll email a reset link. Google/GitHub accounts sign in with those providers instead."
      }
    >
      {done ? (
        <Link
          href="/sign-in"
          className="auth-cta inline-flex min-h-12 w-full items-center justify-center gap-2 text-[0.95rem] font-semibold no-underline"
        >
          Back to sign in
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)]">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-12 border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] px-3.5 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
            />
          </label>
          {error ? (
            <p className="text-[var(--v2-text-sm)] text-[var(--v2-danger)]">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="auth-cta inline-flex min-h-12 w-full items-center justify-center gap-2 text-[0.95rem] font-semibold disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
            {!loading ? <ArrowRight className="size-4" aria-hidden /> : null}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
        <Link href="/sign-in" className="font-semibold text-[var(--v2-primary)]">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

export function ResetPasswordScreen() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(
    !email || !token ? "Missing reset link details." : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !token) return;
    setLoading(true);
    setError(null);
    try {
      await v2Api.resetPassword({ email, token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={done ? "Password updated" : "Choose a new password"}
      subtitle={
        done
          ? "You can sign in with your new password now."
          : email
            ? `Resetting password for ${email}`
            : "Open the link from your email to continue."
      }
    >
      {done ? (
        <Link
          href="/sign-in"
          className="auth-cta inline-flex min-h-12 w-full items-center justify-center gap-2 text-[0.95rem] font-semibold no-underline"
        >
          Sign in
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)]">
              New password
            </span>
            <span className="flex items-center border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)]">
              <input
                type={show ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-12 w-full bg-transparent px-3.5 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none"
              />
              <button
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                className="flex size-10 items-center justify-center text-[var(--v2-fg-muted)]"
                onClick={() => setShow((v) => !v)}
              >
                {show ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </span>
          </label>
          {error ? (
            <p className="text-[var(--v2-text-sm)] text-[var(--v2-danger)]">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading || !email || !token}
            className="auth-cta inline-flex min-h-12 w-full items-center justify-center gap-2 text-[0.95rem] font-semibold disabled:opacity-50"
          >
            {loading ? "Saving…" : "Update password"}
            {!loading ? <ArrowRight className="size-4" aria-hidden /> : null}
          </button>
        </form>
      )}
    </AuthCard>
  );
}

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col justify-center px-4 py-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--v2-fg-subtle)]">
        Account
      </p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-[var(--v2-fg)]">
        {title}
      </h1>
      <p className="mt-2 text-[var(--v2-text-sm)] leading-relaxed text-[var(--v2-fg-muted)]">
        {subtitle}
      </p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
