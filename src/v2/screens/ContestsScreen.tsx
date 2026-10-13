"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { PlatformBadge } from "@/v2/components/Badge";
import { Button } from "@/v2/components/Button";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { EmptyState } from "@/v2/components/EmptyState";
import { LINKABLE_PLATFORMS, PLATFORMS } from "@/v2/design/platforms";
import type { ContestDto } from "@/v2/lib/api";
import { cn } from "@/v2/lib/cn";

type View = "agenda" | "calendar";

export function ContestsScreen({ contests }: { contests: ContestDto[] }) {
  const [view, setView] = useState<View>("agenda");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return contests
      .filter((c) =>
        platforms.length === 0 ? true : platforms.includes(c.platform),
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }, [contests, platforms]);

  const byDay = useMemo(() => {
    const map = new Map<string, ContestDto[]>();
    for (const c of filtered) {
      const key = new Date(c.startsAt).toLocaleDateString("en-CA"); // YYYY-MM-DD local-ish
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [filtered]);

  const dayContests = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      <header className="public-page-hero mb-4 flex flex-wrap items-end justify-between gap-4 rounded-none sm:rounded-[var(--v2-radius-xl)] sm:border sm:border-[var(--v2-border)]">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--v2-primary)]">
            Calendar
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-bold tracking-tight text-[var(--v2-fg)]">
            Contests
          </h1>
          <p className="mt-1 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Times shown in your local timezone
          </p>
        </div>
        <div className="flex rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-1">
          {(["agenda", "calendar"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "min-h-9 rounded-[var(--v2-radius-sm)] px-3 text-[var(--v2-text-sm)] font-medium capitalize",
                view === v
                  ? "bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
                  : "text-[var(--v2-fg-muted)]",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {LINKABLE_PLATFORMS.map((id) => {
          const on = platforms.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() =>
                setPlatforms((prev) =>
                  on ? prev.filter((p) => p !== id) : [...prev, id],
                )
              }
              className={cn(
                "min-h-9 rounded-[var(--v2-radius-full)] border px-3 font-mono text-[11px] font-semibold",
                on
                  ? "border-transparent bg-[var(--v2-primary)] text-[var(--v2-fg-inverse)]"
                  : "border-[var(--v2-border)] text-[var(--v2-fg-muted)]",
              )}
            >
              {PLATFORMS[id].short}
            </button>
          );
        })}
        {platforms.length > 0 ? (
          <button
            type="button"
            className="min-h-9 px-2 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]"
            onClick={() => setPlatforms([])}
          >
            Clear
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No contests match"
            description="Try clearing filters or sync contests from the server."
          />
        </Card>
      ) : view === "agenda" ? (
        <div className="flex flex-col gap-4">
          {[...byDay.entries()].map(([day, list]) => (
            <Card key={day}>
              <CardHeader>
                <h2 className="font-mono text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  {new Date(day + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
              </CardHeader>
              <CardBody className="space-y-3 pt-0">
                {list.map((c) => (
                  <ContestRow key={`${c.platform}-${c.externalId}`} contest={c} />
                ))}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <MonthCalendar
          byDay={byDay}
          onSelectDay={(d) => setSelectedDay(d)}
        />
      )}

      <BottomSheet
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={
          selectedDay
            ? new Date(selectedDay + "T12:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
            : undefined
        }
      >
        {dayContests.length === 0 ? (
          <EmptyState title="No contests this day" />
        ) : (
          <div className="space-y-3">
            {dayContests.map((c) => (
              <ContestRow key={`${c.platform}-${c.externalId}`} contest={c} />
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function ContestRow({ contest: c }: { contest: ContestDto }) {
  const start = new Date(c.startsAt);
  const ics = `/api/contests/ics?platform=${encodeURIComponent(c.platform)}`;
  return (
    <div className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] p-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <PlatformBadge platform={c.platform} />
        <p className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
          {c.name}
        </p>
      </div>
      <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
        {start.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {c.durationSeconds
          ? ` · ${Math.round(Number(c.durationSeconds) / 60)} min`
          : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {c.url ? (
          <a href={c.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="secondary">
              Open
            </Button>
          </a>
        ) : null}
        <a href={ics}>
          <Button size="sm" variant="ghost">
            Add to calendar
          </Button>
        </a>
      </div>
    </div>
  );
}

function MonthCalendar({
  byDay,
  onSelectDay,
}: {
  byDay: Map<string, ContestDto[]>;
  onSelectDay: (day: string) => void;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < startPad; i++) cells.push({ day: null, key: `p-${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, key });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">
          {now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
      </CardHeader>
      <CardBody>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-[var(--v2-fg-subtle)]">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c) => {
            if (c.day == null) return <div key={c.key} className="min-h-14" />;
            const list = byDay.get(c.key) ?? [];
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelectDay(c.key)}
                className="min-h-14 rounded-[var(--v2-radius-sm)] border border-[var(--v2-border)] bg-[var(--v2-bg)] p-1 text-left hover:border-[var(--v2-primary)]"
              >
                <span className="font-mono text-[11px] text-[var(--v2-fg-muted)]">
                  {c.day}
                </span>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {list.slice(0, 3).map((x) => (
                    <span
                      key={`${x.platform}-${x.externalId}`}
                      className="size-1.5 rounded-full"
                      style={{
                        background:
                          PLATFORMS[x.platform as keyof typeof PLATFORMS]
                            ?.colorVar ?? "var(--v2-primary)",
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
