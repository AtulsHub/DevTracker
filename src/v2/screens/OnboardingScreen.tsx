"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { v2Api } from "@/v2/lib/api";
import { cn } from "@/v2/lib/cn";

export function OnboardingScreen({
  initialName,
}: {
  initialName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(initialName);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    setError(null);
    try {
      await v2Api.patchMe({
        displayName: displayName || undefined,
        profileVisibility: visibility,
      });
      startTransition(() => router.push("/dashboard"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col justify-center px-4 py-8">
      <p className="font-mono text-[var(--v2-text-xs)] font-semibold uppercase tracking-wider text-[var(--v2-primary)]">
        Welcome
      </p>
      <h1 className="mt-1 text-[var(--v2-text-2xl)] font-bold">
        Set up your profile
      </h1>
      <p className="mb-5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
        You can change this anytime in Settings.
      </p>
      <Card>
        <CardBody className="flex flex-col gap-4">
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <fieldset>
            <legend className="mb-2 text-[var(--v2-text-sm)] font-medium">
              Profile visibility
            </legend>
            <div className="flex gap-2">
              {(["PUBLIC", "PRIVATE"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={cn(
                    "flex-1 rounded-[var(--v2-radius-md)] border px-3 py-2 text-[var(--v2-text-sm)] font-medium",
                    visibility === v
                      ? "border-[var(--v2-primary)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
                      : "border-[var(--v2-border)] text-[var(--v2-fg-muted)]",
                  )}
                >
                  {v === "PUBLIC" ? "Public" : "Private"}
                </button>
              ))}
            </div>
          </fieldset>
          {error ? (
            <p className="text-[var(--v2-text-sm)] text-[var(--v2-danger)]">
              {error}
            </p>
          ) : null}
          <Button
            loading={pending}
            onClick={() => void finish()}
            className="w-full"
          >
            Continue to dashboard
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
