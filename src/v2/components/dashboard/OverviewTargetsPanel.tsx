"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { EmptyState } from "@/v2/components/EmptyState";
import { v2Api, type TargetDto } from "@/v2/lib/api";
import {
  TARGET_TYPES,
  targetTypeMeta,
  type TargetTypeId,
} from "@/v2/lib/targetTypes";
import { cn } from "@/v2/lib/cn";

const CREATE_TYPES: TargetTypeId[] = [
  "SOLVE_COUNT",
  "STREAK",
  "RATING_GOAL",
  "CONTEST_PARTICIPATION",
];

function serializeTarget(t: TargetDto): TargetDto {
  return {
    ...t,
    startsAt: t.startsAt
      ? t.startsAt instanceof Date
        ? t.startsAt.toISOString()
        : String(t.startsAt)
      : null,
    endsAt: t.endsAt
      ? t.endsAt instanceof Date
        ? t.endsAt.toISOString()
        : String(t.endsAt)
      : null,
  };
}

export function OverviewTargetsPanel({
  initialTargets,
}: {
  initialTargets: TargetDto[];
}) {
  const [targets, setTargets] = useState(() =>
    initialTargets.map(serializeTarget),
  );
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<TargetTypeId>("SOLVE_COUNT");
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("7");
  const [days, setDays] = useState("7");

  const meta = targetTypeMeta(type);

  const personal = useMemo(
    () => targets.filter((t) => t.source !== "team" && !t.teamId),
    [targets],
  );
  const team = useMemo(
    () => targets.filter((t) => t.source === "team" || Boolean(t.teamId)),
    [targets],
  );

  async function refresh() {
    const r = await v2Api.myTargets();
    setTargets(r.targets.map(serializeTarget));
  }

  async function create() {
    setError(null);
    const goalValue = Number.parseInt(goal, 10);
    const windowDays = Number.parseInt(days, 10);
    if (!title.trim() || !Number.isFinite(goalValue) || goalValue < 1) {
      setError(`Enter a title and ${meta.goalLabel.toLowerCase()} ≥ 1`);
      return;
    }
    startTransition(async () => {
      try {
        await v2Api.createTarget({
          title: title.trim(),
          type,
          goalValue,
          startsAt: new Date().toISOString(),
          endsAt: new Date(
            Date.now() +
              (Number.isFinite(windowDays) ? windowDays : 7) * 86400000,
          ).toISOString(),
        });
        setOpen(false);
        setTitle("");
        setGoal(meta.goalPlaceholder);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create target");
      }
    });
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              Targets
            </h2>
            <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
              Personal goals plus targets from teams you’ve joined
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" aria-hidden />
            New target
          </Button>
        </div>

        {targets.length === 0 ? (
          <Card>
            <EmptyState
              title="No targets yet"
              description="Set a personal solve or streak goal — team targets appear here when you’re assigned."
              className="py-8"
              action={
                <Button size="sm" onClick={() => setOpen(true)}>
                  Create a target
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {personal.length > 0 ? (
              <TargetGroup title="Personal" items={personal} />
            ) : (
              <Card>
                <CardBody>
                  <p className="text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                    No personal targets yet.{" "}
                    <button
                      type="button"
                      onClick={() => setOpen(true)}
                      className="font-medium text-[var(--v2-primary)] underline-offset-2 hover:underline"
                    >
                      Create one
                    </button>
                  </p>
                </CardBody>
              </Card>
            )}
            {team.length > 0 ? (
              <TargetGroup title="From your teams" items={team} />
            ) : (
              <Card>
                <CardBody>
                  <p className="text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                    No team targets assigned. Join a team or wait for a lead to
                    set one.{" "}
                    <Link
                      href="/teams"
                      className="font-medium text-[var(--v2-primary)] no-underline hover:underline"
                    >
                      Teams
                    </Link>
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </section>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="New personal target"
      >
        <label className="mb-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--v2-fg-subtle)]">
            Type
          </span>
          <select
            value={type}
            onChange={(e) => {
              const next = e.target.value as TargetTypeId;
              setType(next);
              setGoal(targetTypeMeta(next).goalPlaceholder);
            }}
            className="min-h-9 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
          >
            {CREATE_TYPES.map((id) => {
              const t = TARGET_TYPES.find((x) => x.id === id)!;
              return (
                <option key={id} value={id}>
                  {t.label}
                </option>
              );
            })}
          </select>
          <span className="text-[11px] text-[var(--v2-fg-subtle)]">
            {meta.description}
          </span>
        </label>
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            type === "STREAK" ? "7-day streak" : "Solve 10 this week"
          }
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Input
            label={meta.goalLabel}
            type="number"
            min={1}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <Input
            label="Window (days)"
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
        {error ? (
          <p className="mt-3 text-[var(--v2-text-xs)] text-[var(--v2-danger)]">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            loading={pending}
            onClick={() => void create()}
          >
            Create target
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}

function TargetGroup({
  title,
  items,
}: {
  title: string;
  items: TargetDto[];
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
          {title}
        </h3>
        <span className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
          {items.length}
        </span>
      </CardHeader>
      <CardBody className="space-y-3 pt-0">
        {items.map((t) => (
          <TargetRow key={t.id} target={t} />
        ))}
      </CardBody>
    </Card>
  );
}

function TargetRow({ target }: { target: TargetDto }) {
  const current = target.progress?.currentValue ?? 0;
  const goal = Math.max(target.progress?.goalValue ?? 1, 1);
  const pct = Math.min(100, Math.round((current / goal) * 100));
  const done = Boolean(target.progress?.isCompleted);
  const typeLabel = targetTypeMeta(target.type).label;

  return (
    <div className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border-subtle)] bg-[var(--v2-bg)]/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
            {target.title}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--v2-fg-subtle)]">
            {typeLabel}
            {target.teamName ? (
              <>
                {" · "}
                {target.teamSlug ? (
                  <Link
                    href={`/teams/${target.teamSlug}`}
                    className="text-[var(--v2-primary)] no-underline hover:underline"
                  >
                    {target.teamName}
                  </Link>
                ) : (
                  target.teamName
                )}
              </>
            ) : null}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 font-mono text-[var(--v2-text-xs)] font-semibold tabular-nums",
            done ? "text-[var(--v2-success)]" : "text-[var(--v2-fg)]",
          )}
        >
          {current}/{goal}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-[var(--v2-radius-full)] bg-[var(--v2-bg-muted)]"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={goal}
      >
        <div
          className={cn(
            "h-full rounded-[var(--v2-radius-full)] transition-[width]",
            done ? "bg-[var(--v2-success)]" : "bg-[var(--v2-primary)]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
