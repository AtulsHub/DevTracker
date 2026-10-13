"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { Skeleton } from "@/v2/components/Skeleton";
import { EmptyState } from "@/v2/components/EmptyState";
import { v2Api } from "@/v2/lib/api";

function JoinInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const codeParam = searchParams.get("code");
  const [code, setCode] = useState(codeParam ?? "");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "pending" | "error"
  >(codeParam ? "loading" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [teamSlug, setTeamSlug] = useState<string | null>(null);

  async function join(inviteCode: string) {
    setStatus("loading");
    setError(null);
    try {
      const data = await v2Api.joinByCode(inviteCode.trim().toUpperCase());
      setTeamSlug(data.slug ?? null);
      // Already-a-member returns ACTIVE/PENDING without error
      if (data.slug && data.status === "ACTIVE") {
        router.replace(`/teams/${data.slug}`);
        return;
      }
      setStatus(data.status === "PENDING" ? "pending" : "success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to join team");
    }
  }

  useEffect(() => {
    if (codeParam) void join(codeParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (status === "error" && codeParam) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <EmptyState
          title="Could not join"
          description={error ?? "Unknown error"}
          action={
            <Link href="/teams">
              <Button variant="secondary">Back to teams</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (status === "success" || status === "pending") {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardBody className="text-center">
            <h1 className="font-[family-name:var(--font-display)] text-[var(--v2-text-xl)] font-bold">
              {status === "pending" ? "Request sent" : "You're in"}
            </h1>
            <p className="mt-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              {status === "pending"
                ? "A team admin needs to approve your request."
                : "Welcome to the team."}
            </p>
            {teamSlug ? (
              <Button
                className="mt-4"
                onClick={() => router.push(`/teams/${teamSlug}`)}
              >
                Open team
              </Button>
            ) : (
              <Link href="/teams" className="mt-4 inline-block">
                <Button>Teams</Button>
              </Link>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-[var(--v2-text-2xl)] font-bold">
        Join a team
      </h1>
      <p className="mt-1 mb-5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
        Enter the invite code from your team lead.
      </p>
      <Card>
        <CardBody className="flex flex-col gap-3">
          <Input
            label="Invite code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD1234"
            error={error ?? undefined}
          />
          <Button
            onClick={() => void join(code)}
            disabled={!code.trim()}
          >
            Join
          </Button>
          <Link
            href="/teams"
            className="text-center text-[var(--v2-text-sm)] text-[var(--v2-primary)]"
          >
            Back to teams
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}

export default function JoinTeamPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16">
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <JoinInner />
    </Suspense>
  );
}
