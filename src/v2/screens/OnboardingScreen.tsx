"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Link2, Target, Users } from "lucide-react";
import { Card, CardBody } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { v2Api } from "@/v2/lib/api";
import { LINKABLE_PLATFORMS, PLATFORMS } from "@/v2/design/platforms";
import { cn } from "@/v2/lib/cn";
import { BrandMark } from "@/v2/components/Brand";
import { useToast } from "@/v2/feedback/ToastProvider";

type Step = 0 | 1 | 2 | 3;

export function OnboardingScreen({
  initialName,
}: {
  initialName: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>(0);
  const [displayName, setDisplayName] = useState(initialName);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [platform, setPlatform] = useState<string>(LINKABLE_PLATFORMS[0] ?? "codeforces");
  const [handle, setHandle] = useState("");
  const [linked, setLinked] = useState(false);
  const [targetTitle, setTargetTitle] = useState("Solve 5 this week");
  const [targetGoal, setTargetGoal] = useState("5");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(
    () => ["Profile", "Platforms", "Team", "Target"],
    [],
  );

  async function saveProfile() {
    setError(null);
    try {
      await v2Api.patchMe({
        displayName: displayName || undefined,
        profileVisibility: visibility,
      });
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile");
    }
  }

  async function linkPlatform() {
    setError(null);
    if (!handle.trim()) {
      setError("Enter your handle");
      return;
    }
    try {
      await v2Api.linkPlatform(platform, handle.trim());
      setLinked(true);
      toast.success("Platform linked", "We’ll sync it in the background.");
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not link platform");
    }
  }

  async function createStarterTarget() {
    setError(null);
    const goal = Number(targetGoal);
    if (!targetTitle.trim() || !Number.isFinite(goal) || goal < 1) {
      setError("Enter a title and a goal ≥ 1");
      return;
    }
    try {
      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + 7 * 86400000);
      await v2Api.createTarget({
        title: targetTitle.trim(),
        type: "SOLVE_COUNT",
        goalValue: goal,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
      toast.success("Target created");
      finish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create target");
    }
  }

  function finish() {
    startTransition(() => router.push("/dashboard"));
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-lg flex-col justify-center px-4 py-8">
      <div className="mb-1 flex items-center gap-2.5">
        <BrandMark size="md" />
        <span className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)]">
          Welcome
        </span>
      </div>
      <h1 className="mt-4 text-[1.5rem] font-semibold tracking-tight text-[var(--v2-fg)]">
        Get contest-ready in a minute
      </h1>
      <p className="mb-5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
        Link a platform, optionally join a team, set one target — then Overview
        fills itself.
      </p>

      <ol className="mb-5 flex gap-1.5">
        {steps.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex-1 rounded-full px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide",
              i === step
                ? "bg-[var(--v2-primary)] text-[var(--v2-on-primary)]"
                : i < step
                  ? "bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
                  : "bg-[var(--v2-bg-muted)] text-[var(--v2-fg-subtle)]",
            )}
          >
            {i < step ? <Check className="mx-auto size-3.5" /> : label}
          </li>
        ))}
      </ol>

      <Card>
        <CardBody className="flex flex-col gap-4">
          {step === 0 ? (
            <>
              <Input
                label="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <fieldset>
                <legend className="mb-2 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)]">
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
              <Button loading={pending} onClick={() => void saveProfile()} className="w-full">
                Continue
                <ArrowRight className="size-3.5" />
              </Button>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <p className="flex items-center gap-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                <Link2 className="size-4" />
                Link at least one platform so heatmaps and solves appear.
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                  Platform
                </span>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="min-h-10 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-text-sm)]"
                >
                  {LINKABLE_PLATFORMS.map((id) => (
                    <option key={id} value={id}>
                      {PLATFORMS[id].label}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Handle"
                placeholder="your_handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Skip
                </Button>
                <Button
                  loading={pending}
                  className="flex-1"
                  onClick={() => void linkPlatform()}
                >
                  {linked ? "Linked — next" : "Link & continue"}
                </Button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className="flex items-center gap-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                <Users className="size-4" />
                Join with an invite code, or browse teams later.
              </p>
              <Input
                label="Invite code"
                placeholder="optional"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <Button
                className="w-full"
                variant="secondary"
                loading={pending}
                disabled={!inviteCode.trim()}
                onClick={() =>
                  void (async () => {
                    setError(null);
                    try {
                      await v2Api.joinByCode(inviteCode.trim());
                      toast.success("Joined team");
                      setStep(3);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Could not join team",
                      );
                    }
                  })()
                }
              >
                Join with code
              </Button>
              <Link href="/teams" className="no-underline">
                <Button className="w-full" variant="ghost">
                  Browse teams
                </Button>
              </Link>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Skip
                </Button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <p className="flex items-center gap-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                <Target className="size-4" />
                One personal target for this week. You can edit it anytime.
              </p>
              <Input
                label="Title"
                value={targetTitle}
                onChange={(e) => setTargetTitle(e.target.value)}
              />
              <Input
                label="Problems to solve"
                type="number"
                min={1}
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  loading={pending}
                  onClick={() => finish()}
                >
                  Skip to Overview
                </Button>
                <Button
                  className="flex-1"
                  loading={pending}
                  onClick={() => void createStarterTarget()}
                >
                  Create target
                </Button>
              </div>
            </>
          ) : null}

          {error ? (
            <p className="text-[var(--v2-text-sm)] text-[var(--v2-danger)]">
              {error}
            </p>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
