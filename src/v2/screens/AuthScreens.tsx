"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody } from "@/v2/components/Card";
import { Input } from "@/v2/components/Input";
import { Button } from "@/v2/components/Button";
import { v2Api } from "@/v2/lib/api";

export function SignInScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to sync platforms and teams">
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error ?? undefined}
        />
        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>
      <OAuthButtons callbackUrl={callbackUrl} />
      <p className="mt-4 text-center text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
        No account?{" "}
        <Link href="/sign-up" className="text-[var(--v2-primary)]">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

export function SignUpScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await v2Api.register({ username, email, password });
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        router.push("/sign-in");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Start tracking your DSA progress">
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
        <Input
          label="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error ?? undefined}
        />
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
      <OAuthButtons callbackUrl="/dashboard" />
      <p className="mt-4 text-center text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-[var(--v2-primary)]">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-[70dvh] w-full max-w-md flex-col justify-center px-4 py-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,var(--v2-primary-muted),transparent_70%)]"
        aria-hidden
      />
      <p className="relative font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--v2-primary)]">
        DevTrack
      </p>
      <h1 className="relative mt-3 font-[family-name:var(--font-display)] text-[clamp(1.5rem,4vw,1.85rem)] font-bold tracking-tight text-[var(--v2-fg)]">
        {title}
      </h1>
      <p className="relative mb-5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
        {subtitle}
      </p>
      <Card className="relative">
        <CardBody>{children}</CardBody>
      </Card>
    </div>
  );
}

function OAuthButtons({ callbackUrl }: { callbackUrl: string }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={() => void signIn("google", { callbackUrl })}
      >
        Google
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => void signIn("github", { callbackUrl })}
      >
        GitHub
      </Button>
    </div>
  );
}
