/**
 * src/app/(auth)/sign-up/page.tsx
 * Sign-up page — creates a new account with email + password.
 * OAuth sign-up goes through the same OAuth flow as sign-in.
 */
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim().toLowerCase(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = (await res.json()) as { error?: { message: string } };

      if (!res.ok || data.error) {
        setError(data.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      // Sign in automatically after registration
      const result = await signIn("credentials", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created! Please sign in.");
        router.push("/sign-in");
      } else {
        router.push("/onboarding");
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-strong)",
    backgroundColor: "var(--bg-elevated)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    fontFamily: "var(--font-mono)",
  };

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
      <div style={{ width: "100%", maxWidth: "420px" }}>
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
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Create your free account
          </p>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          {/* OAuth */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl: "/onboarding" })}
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
              }}
            >
              🐙 Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
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
              }}
            >
              🔵 Continue with Google
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>or email</span>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
              <label htmlFor="username" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                pattern="[a-z0-9_-]{3,40}"
                title="3-40 characters: lowercase letters, numbers, hyphens, underscores"
                value={form.username}
                onChange={handleChange}
                placeholder="yourhandle"
                style={inputStyle}
              />
              <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
                3–40 chars · lowercase, numbers, _ and - only
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label htmlFor="email" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label htmlFor="password" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label htmlFor="confirmPassword" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                style={inputStyle}
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
                marginTop: "0.25rem",
              }}
            >
              {isPending ? "Creating account…" : "Create account →"}
            </button>

            <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", textAlign: "center", lineHeight: 1.5 }}>
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--text-tertiary)", marginTop: "1.25rem" }}>
          Already have an account?{" "}
          <Link href="/sign-in" style={{ color: "var(--accent)", textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
