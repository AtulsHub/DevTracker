"use client";

import { useState } from "react";
import Link from "next/link";
import { Syne, DM_Sans } from "next/font/google";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { v2Api } from "@/v2/lib/api";
import { LINKABLE_PLATFORMS, PLATFORMS } from "@/v2/design/platforms";
import { siteHomeHref } from "@/v2/lib/site";
import { BrandLockup, BrandMark } from "@/v2/components/Brand";
import { cn } from "@/v2/lib/cn";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-auth-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-auth-body",
  display: "swap",
});

export function SignInScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const verified = params.get("verified") === "1";
  const urlError = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    verified
      ? "Email verified — you can sign in now."
      : urlError === "verification_expired"
        ? "Verification link expired. Resend a new one below."
        : urlError === "verification_invalid" || urlError === "missing_verification"
          ? "That verification link is invalid."
          : null,
  );
  const [needsVerify, setNeedsVerify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsVerify(false);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      const code = (res as { code?: string }).code ?? res.error;
      if (
        code === "email_not_verified" ||
        String(res.error).toLowerCase().includes("email_not_verified")
      ) {
        setNeedsVerify(true);
        setError("Verify your email before signing in.");
        return;
      }
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  async function resend() {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    setResending(true);
    try {
      await v2Api.resendVerification(email);
      setInfo("If an unverified account exists, a new link is on its way.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      mode="signin"
      title="Welcome back"
      subtitle="Pick up your streak, contests, and team pulse where you left them."
    >
      {info ? (
        <p className="mb-4 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-primary-muted)] px-3 py-2.5 text-[var(--v2-text-sm)] text-[var(--auth-fg)]">
          {info}
        </p>
      ) : null}
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error ?? undefined}
          trailing={
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="flex size-9 items-center justify-center text-[var(--auth-muted)] transition-colors hover:text-[var(--auth-fg)]"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          }
        />
        {needsVerify ? (
          <button
            type="button"
            disabled={resending}
            onClick={() => void resend()}
            className="text-left text-[var(--v2-text-sm)] font-medium text-[var(--auth-accent)] underline-offset-2 hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend verification email"}
          </button>
        ) : null}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[var(--v2-text-sm)] font-medium text-[var(--auth-muted)] no-underline hover:text-[var(--auth-accent)]"
          >
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="auth-cta mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 text-[0.95rem] font-semibold transition-[transform,filter] duration-200 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
          {!loading ? <ArrowRight className="size-4" aria-hidden /> : null}
        </button>
      </form>
      <OAuthButtons callbackUrl={callbackUrl} />
      <p className="mt-6 text-center text-[var(--v2-text-sm)] text-[var(--auth-muted)]">
        New here?{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-[var(--auth-accent)] no-underline hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function SignUpScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVerify, setPendingVerify] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await v2Api.register({ username, email, password });
      if (res.autoVerified || res.needsVerification === false) {
        const signed = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (!signed?.error) {
          window.location.href = "/dashboard";
          return;
        }
      }
      setPendingVerify(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (pendingVerify) {
    return (
      <AuthShell
        mode="signup"
        title="Check your inbox"
        subtitle="We sent a verification link. Confirm your email, then sign in — Google/GitHub sign-up skips this."
      >
        <div className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--auth-panel)] px-4 py-4 text-[var(--v2-text-sm)] leading-relaxed text-[var(--auth-muted)]">
          Sent to <span className="font-medium text-[var(--auth-fg)]">{email}</span>.
          The link expires in 24 hours.
        </div>
        <Link
          href="/sign-in"
          className="auth-cta mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 text-[0.95rem] font-semibold no-underline"
        >
          Go to sign in
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <OAuthButtons callbackUrl="/dashboard" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      mode="signup"
      title="Start your pulse"
      subtitle="One account for Codeforces, LeetCode, AtCoder, and the rest of the grind."
    >
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <AuthField
          label="Username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          hint="Public handle on DevTrack"
        />
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error ?? undefined}
          hint={!error ? "At least 8 characters" : undefined}
          trailing={
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="flex size-9 items-center justify-center text-[var(--auth-muted)] transition-colors hover:text-[var(--auth-fg)]"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          }
        />
        <button
          type="submit"
          disabled={loading}
          className="auth-cta mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 text-[0.95rem] font-semibold transition-[transform,filter] duration-200 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create account"}
          {!loading ? <ArrowRight className="size-4" aria-hidden /> : null}
        </button>
      </form>
      <OAuthButtons callbackUrl="/dashboard" />
      <p className="mt-6 text-center text-[var(--v2-text-sm)] text-[var(--auth-muted)]">
        Already grinding?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-[var(--auth-accent)] no-underline hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({
  mode,
  title,
  subtitle,
  children,
}: {
  mode: "signin" | "signup";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${syne.variable} ${dmSans.variable} auth`}>
      <div className="relative mx-auto grid min-h-[calc(100dvh-var(--v2-topbar-h)-var(--v2-bottom-nav-h))] w-full max-w-[1100px] lg:min-h-[calc(100dvh-var(--v2-topbar-h))] lg:grid-cols-[1.05fr_0.95fr]">
        <AuthVisual mode={mode} />

        <section className="relative flex flex-col justify-center px-5 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-16">
          <div className="auth-rise mx-auto w-full max-w-[400px]">
            <Link
              href={siteHomeHref(false)}
              className="mb-6 inline-flex items-center no-underline sm:mb-8 lg:hidden"
              aria-label="DevTrack home"
            >
              <BrandLockup
                size="md"
                labelClassName="auth-display text-[var(--v2-text-base)] text-[var(--auth-fg)]"
              />
            </Link>

            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--auth-muted)]">
              {mode === "signup" ? "Join the board" : "Return to the board"}
            </p>
            <h1 className="auth-rise auth-rise-delay-1 auth-display mt-3 text-[clamp(1.85rem,4vw,2.35rem)] font-semibold leading-[1.1] tracking-tight text-[var(--auth-fg)]">
              {title}
            </h1>
            <p className="auth-rise auth-rise-delay-2 mt-2 text-[0.98rem] leading-relaxed text-[var(--auth-muted)]">
              {subtitle}
            </p>

            <div className="auth-rise auth-rise-delay-3 mt-8">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AuthVisual({ mode }: { mode: "signin" | "signup" }) {
  return (
    <aside className="relative hidden overflow-hidden bg-[var(--auth-ink)] text-[var(--auth-ink-fg)] lg:flex lg:flex-col">
      <div className="auth-plane-drift absolute inset-0 opacity-90">
        <AuthHeatPlane />
      </div>
      <div className="auth-scan pointer-events-none absolute inset-x-0 top-0 z-[1] h-28 bg-gradient-to-b from-[color-mix(in_srgb,var(--auth-accent)_38%,transparent)] to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[var(--auth-ink)] via-[color-mix(in_srgb,var(--auth-ink)_55%,transparent)] to-transparent" />

      <div className="relative z-[2] flex flex-1 flex-col justify-between p-10 xl:p-12">
        <Link
          href={siteHomeHref(false)}
          className="inline-flex items-center gap-2.5 no-underline"
          aria-label="DevTrack home"
        >
          <BrandMark size="md" />
          <span className="auth-display text-[var(--v2-text-base)] font-semibold tracking-tight text-[var(--auth-ink-fg)]">
            DevTrack
          </span>
        </Link>

        <div className="max-w-md pb-4">
          <p className="auth-rise auth-display text-[clamp(2.4rem,5vw,3.6rem)] font-bold leading-[0.92] tracking-[-0.03em]">
            {mode === "signup"
              ? "Build the graph. Own the season."
              : "Your platforms. One pulse."}
          </p>
          <p className="auth-rise auth-rise-delay-1 mt-4 max-w-sm text-[0.98rem] leading-relaxed text-[color-mix(in_srgb,var(--auth-ink-fg)_68%,transparent)]">
            {mode === "signup"
              ? "Link once, then watch ratings, solves, and contest days land in the same workspace."
              : "Sync is waiting. Jump back into streaks, targets, and the next contest window."}
          </p>

          <ul className="auth-rise auth-rise-delay-2 mt-8 flex flex-wrap gap-2">
            {LINKABLE_PLATFORMS.slice(0, 5).map((id) => (
              <li
                key={id}
                className="border border-[color-mix(in_srgb,var(--auth-ink-fg)_18%,transparent)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--auth-ink-fg)_78%,transparent)]"
              >
                {PLATFORMS[id].short}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

function AuthHeatPlane() {
  const cells = 96;
  const pattern = [
    0, 1, 0, 2, 3, 1, 0, 4, 2, 0, 1, 3, 0, 2, 4, 1, 0, 0, 3, 2, 1, 0, 4, 0, 2,
    3, 1, 0, 0, 2, 4, 1, 3, 0, 1, 2, 0, 4, 3, 1, 0, 2, 0, 1, 3, 4, 0, 2, 1, 0,
    3, 0, 4, 2, 1, 0, 0, 3, 1, 2, 4, 0, 1, 0, 2, 3, 0, 1, 4, 2, 0, 3, 1, 0, 2,
    0, 4, 1, 3, 0, 2, 1, 0, 3, 1, 0, 4, 2, 0, 1, 3, 0, 2, 4, 1,
  ];

  return (
    <div
      className="grid h-full w-[115%] grid-cols-12 gap-1.5 p-6 opacity-70"
      aria-hidden
    >
      {Array.from({ length: cells }, (_, i) => {
        const level = pattern[i % pattern.length] ?? 0;
        const opacity =
          level === 0 ? 0.08 : level === 1 ? 0.22 : level === 2 ? 0.4 : level === 3 ? 0.62 : 0.9;
        return (
          <span
            key={i}
            className="auth-heat-cell aspect-square rounded-[2px] bg-[var(--auth-accent)]"
            style={{
              opacity,
              animationDelay: `${(i % 17) * 0.12}s`,
            }}
          />
        );
      })}
    </div>
  );
}

function AuthField({
  label,
  error,
  hint,
  trailing,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[var(--v2-text-sm)] font-medium text-[var(--auth-muted)]">
        {label}
      </span>
      <span
        className={cn(
          "auth-field flex items-center border border-[var(--auth-line)] bg-[var(--auth-panel)] transition-[border-color,box-shadow] duration-200",
          error && "border-[var(--v2-danger)]",
          className,
        )}
      >
        <input
          className="min-h-12 w-full bg-transparent px-3.5 text-[var(--v2-text-sm)] text-[var(--auth-fg)] outline-none placeholder:text-[var(--v2-fg-subtle)]"
          {...props}
        />
        {trailing}
      </span>
      {error ? (
        <span className="text-[var(--v2-text-xs)] text-[var(--v2-danger)]">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function OAuthButtons({ callbackUrl }: { callbackUrl: string }) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--auth-line)]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--auth-muted)]">
          or continue with
        </span>
        <span className="h-px flex-1 bg-[var(--auth-line)]" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => void signIn("google", { callbackUrl })}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--auth-line)] bg-[var(--auth-panel)] text-[var(--v2-text-sm)] font-semibold text-[var(--auth-fg)] transition-colors hover:border-[var(--auth-fg)]/35 hover:bg-[var(--v2-surface-hover)]"
        >
          <GoogleIcon className="size-4" />
          Google
        </button>
        <button
          type="button"
          onClick={() => void signIn("github", { callbackUrl })}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--auth-line)] bg-[var(--auth-panel)] text-[var(--v2-text-sm)] font-semibold text-[var(--auth-fg)] transition-colors hover:border-[var(--auth-fg)]/35 hover:bg-[var(--v2-surface-hover)]"
        >
          <GithubIcon className="size-4" />
          GitHub
        </button>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
