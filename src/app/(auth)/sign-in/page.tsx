/**
 * src/app/(auth)/sign-in/page.tsx
 * Sign-in page — supports credentials, GitHub, and Google OAuth.
 */
"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        window.location.href = callbackUrl;
      }
    });
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "var(--bg-base)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            DevTrack
          </Link>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              marginTop: "0.5rem",
            }}
          >
            Sign in to your account
          </p>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          {/* OAuth buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl })}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-strong)",
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "background-color 150ms",
              }}
            >
              <span>🐙</span> Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-strong)",
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "background-color 150ms",
              }}
            >
              <span>🔵</span> Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              or email
            </span>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleCredentials} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {error && (
              <div
                role="alert"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem 1rem",
                  fontSize: "0.8125rem",
                  color: "#fca5a5",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label htmlFor="email" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-strong)",
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 150ms",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label htmlFor="password" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-strong)",
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 150ms",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                border: "none",
                backgroundColor: "var(--accent)",
                color: "var(--text-inverse)",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.7 : 1,
                transition: "opacity 150ms",
              }}
            >
              {isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--text-tertiary)", marginTop: "1.25rem" }}>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" style={{ color: "var(--accent)", textDecoration: "none" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}

