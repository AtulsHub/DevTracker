"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { PlatformBadge } from "@/v2/components/Badge";
import { Button } from "@/v2/components/Button";
import { EmptyState } from "@/v2/components/EmptyState";
import { PageHeader } from "@/v2/components/PageHeader";
import { LINKABLE_PLATFORMS, PLATFORMS } from "@/v2/design/platforms";
import { v2Api, type ContestDto } from "@/v2/lib/api";
import { cn } from "@/v2/lib/cn";
import { googleCalendarEventUrl } from "@/lib/google-calendar-url";

type View = "agenda" | "calendar";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function toDayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return null;
  const mins = Math.round(Number(seconds) / 60);
  if (mins < 60) return `${mins} minutes`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return h === 1 ? "1 hour" : `${h} hours`;
  return `${h}h ${m}m`;
}

function formatCountdown(startsAt: string | Date) {
  const ms = new Date(startsAt).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  if (ms <= 0) return "Live / started";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

export function ContestsScreen({ contests }: { contests: ContestDto[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<View>("calendar");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(() =>
    toDayKey(new Date()),
  );
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const r = await v2Api.refreshContests();
      setRefreshMsg(
        r.upserted > 0
          ? `Synced ${r.upserted} contest update(s)`
          : r.errors?.length
            ? `Refresh finished with issues: ${r.errors[0]}`
            : "No new contests found",
      );
      startTransition(() => router.refresh());
    } catch (e) {
      setRefreshMsg(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  const practicePlatforms = useMemo(
    () => new Set<string>(LINKABLE_PLATFORMS),
    [],
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    return contests
      .filter((c) => practicePlatforms.has(c.platform))
      .filter((c) =>
        platformFilter === "all" ? true : c.platform === platformFilter,
      )
      .filter((c) =>
        upcomingOnly ? new Date(c.startsAt).getTime() >= now - 3 * 3600_000 : true,
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }, [contests, platformFilter, practicePlatforms, upcomingOnly]);

  const byDay = useMemo(() => {
    const map = new Map<string, ContestDto[]>();
    for (const c of filtered) {
      const key = toDayKey(new Date(c.startsAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [filtered]);

  const dayContests = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader
        title="Contests"
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              loading={refreshing || pending}
              onClick={() => void refresh()}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Sync
            </Button>
            <div className="flex rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-0.5">
              {([
                { id: "calendar" as const, label: "Calendar" },
                { id: "agenda" as const, label: "Agenda" },
              ]).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={cn(
                    "min-h-8 rounded-[6px] px-3 text-[var(--v2-text-sm)] font-medium transition-colors duration-[var(--v2-duration)]",
                    view === v.id
                      ? "bg-[var(--v2-bg-muted)] text-[var(--v2-fg)]"
                      : "text-[var(--v2-fg-muted)] hover:text-[var(--v2-fg)]",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </>
        }
      />

      {refreshMsg ? (
        <p
          className="mb-4 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg-muted)] px-3 py-2 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]"
          role="status"
        >
          {refreshMsg}
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="flex min-w-[12rem] flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--v2-fg-subtle)]">
            Platform
          </span>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="min-h-9 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] px-3 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
          >
            <option value="all">All platforms</option>
            {LINKABLE_PLATFORMS.map((id) => (
              <option key={id} value={id}>
                {PLATFORMS[id].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-9 cursor-pointer items-center gap-2 pb-0.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={(e) => setUpcomingOnly(e.target.checked)}
            className="size-4 accent-[var(--v2-primary)]"
          />
          Upcoming only
        </label>
        <p className="pb-2 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
          {filtered.length} contest{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No contests match"
            action={
              <Button
                size="sm"
                loading={refreshing || pending}
                onClick={() => void refresh()}
              >
                Sync contests
              </Button>
            }
          />
        </Card>
      ) : view === "agenda" ? (
        <div className="flex flex-col gap-4">
          {[...byDay.entries()].map(([day, list]) => (
            <Card key={day}>
              <CardHeader>
                <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  {new Date(day + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                <span className="text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                  {list.length} contest{list.length === 1 ? "" : "s"}
                </span>
              </CardHeader>
              <CardBody className="space-y-2 pt-0">
                {list.map((c) => (
                  <ContestRow key={`${c.platform}-${c.externalId}`} contest={c} />
                ))}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <DetailedMonthCalendar
          cursor={cursor}
          onCursorChange={setCursor}
          byDay={byDay}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          dayContests={dayContests}
        />
      )}
    </div>
  );
}

function ContestRow({ contest: c }: { contest: ContestDto }) {
  const start = new Date(c.startsAt);
  const end = c.durationSeconds
    ? new Date(start.getTime() + Number(c.durationSeconds) * 1000)
    : null;
  const duration = formatDuration(c.durationSeconds);
  const platformLabel =
    PLATFORMS[c.platform as keyof typeof PLATFORMS]?.label ?? c.platform;
  const gcal = googleCalendarEventUrl({
    title: `${platformLabel}: ${c.name}`,
    startsAt: start,
    durationSeconds: c.durationSeconds,
    description: [
      `${platformLabel} contest`,
      c.url ? `Open: ${c.url}` : null,
      "Added from DevTrack",
    ]
      .filter(Boolean)
      .join("\n"),
    location: c.url,
  });
  return (
    <div className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border-subtle)] bg-[var(--v2-bg)] p-3 transition-colors hover:border-[var(--v2-border)]">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <PlatformBadge platform={c.platform} />
        <p className="min-w-0 flex-1 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
          {c.name}
        </p>
        {formatCountdown(c.startsAt) ? (
          <span className="rounded-full bg-[var(--v2-primary-muted)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--v2-primary)]">
            {formatCountdown(c.startsAt)}
          </span>
        ) : null}
      </div>
      <dl className="grid gap-1 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)] sm:grid-cols-2">
        <div>
          <dt className="sr-only">Starts</dt>
          <dd>
            {start.toLocaleString(undefined, {
              weekday: "short",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </dd>
        </div>
        {end ? (
          <div>
            <dt className="sr-only">Ends</dt>
            <dd>
              Ends{" "}
              {end.toLocaleString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
              {duration ? ` · ${duration}` : ""}
            </dd>
          </div>
        ) : duration ? (
          <div>
            <dd>Duration · {duration}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        {c.url ? (
          <a href={c.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="secondary">
              Open contest
            </Button>
          </a>
        ) : null}
        <a href={gcal} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="secondary">
            Google Calendar
          </Button>
        </a>
      </div>
    </div>
  );
}

function DetailedMonthCalendar({
  cursor,
  onCursorChange,
  byDay,
  selectedDay,
  onSelectDay,
  dayContests,
}: {
  cursor: Date;
  onCursorChange: (d: Date) => void;
  byDay: Map<string, ContestDto[]>;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  dayContests: ContestDto[];
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDayKey(new Date());

  const cells: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < startPad; i++) cells.push({ day: null, key: `p-${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, key });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, key: `t-${cells.length}` });
  }

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  let monthContestCount = 0;
  for (const [key, list] of byDay) {
    if (key.startsWith(monthPrefix)) monthContestCount += list.length;
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
      <Card className="overflow-hidden">
        <CardHeader className="gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              aria-label="Previous month"
              onClick={() => onCursorChange(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="min-w-0 text-center sm:text-left">
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                {monthLabel}
              </h2>
              <p className="text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                {monthContestCount} contest
                {monthContestCount === 1 ? "" : "s"} this month
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Next month"
              onClick={() => onCursorChange(new Date(year, month + 1, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const n = new Date();
              onCursorChange(new Date(n.getFullYear(), n.getMonth(), 1));
              onSelectDay(toDayKey(n));
            }}
          >
            Today
          </Button>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="mb-2 hidden grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-[var(--v2-fg-subtle)] sm:grid">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-[var(--v2-fg-subtle)] sm:hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((c) => {
              if (c.day == null) {
                return (
                  <div
                    key={c.key}
                    className="min-h-[4.5rem] rounded-[var(--v2-radius-md)] bg-[var(--v2-bg-muted)]/40 sm:min-h-[6.5rem]"
                  />
                );
              }
              const list = byDay.get(c.key) ?? [];
              const isSelected = selectedDay === c.key;
              const isToday = todayKey === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onSelectDay(c.key)}
                  className={cn(
                    "flex min-h-[4.5rem] flex-col rounded-[var(--v2-radius-md)] border p-1.5 text-left transition-colors sm:min-h-[6.5rem] sm:p-2",
                    isSelected
                      ? "border-[var(--v2-primary)] bg-[color-mix(in_srgb,var(--v2-primary)_8%,transparent)]"
                      : "border-[var(--v2-border)] bg-[var(--v2-bg)] hover:bg-[var(--v2-surface-hover)]",
                    isToday && !isSelected && "ring-1 ring-[var(--v2-primary)]/40",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-full text-[12px] font-medium tabular-nums",
                        isToday
                          ? "bg-[var(--v2-primary)] text-[var(--v2-on-primary)]"
                          : "text-[var(--v2-fg-muted)]",
                      )}
                    >
                      {c.day}
                    </span>
                    {list.length > 0 ? (
                      <span className="hidden text-[10px] text-[var(--v2-fg-subtle)] sm:inline">
                        {list.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                    {list.slice(0, 3).map((x) => {
                      const color =
                        PLATFORMS[x.platform as keyof typeof PLATFORMS]
                          ?.colorVar ?? "var(--v2-primary)";
                      return (
                        <div
                          key={`${x.platform}-${x.externalId}`}
                          className="hidden truncate rounded px-1 py-0.5 text-[10px] leading-tight text-[var(--v2-fg)] sm:block"
                          style={{
                            background: `color-mix(in srgb, ${color} 16%, transparent)`,
                            borderLeft: `2px solid ${color}`,
                          }}
                          title={x.name}
                        >
                          {x.name}
                        </div>
                      );
                    })}
                    {list.length > 3 ? (
                      <span className="hidden text-[10px] text-[var(--v2-fg-subtle)] sm:inline">
                        +{list.length - 3} more
                      </span>
                    ) : null}
                    {list.length > 0 ? (
                      <div className="mt-auto flex flex-wrap gap-0.5 sm:hidden">
                        {list.slice(0, 4).map((x) => (
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
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--v2-border-subtle)] pt-3">
            {LINKABLE_PLATFORMS.map((id) => (
              <div
                key={id}
                className="flex items-center gap-1.5 text-[11px] text-[var(--v2-fg-muted)]"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: PLATFORMS[id].colorVar }}
                />
                {PLATFORMS[id].label}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="xl:sticky xl:top-20 xl:self-start">
        <CardHeader>
          <div>
            <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              {selectedDay
                ? new Date(selectedDay + "T12:00:00").toLocaleDateString(
                    undefined,
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    },
                  )
                : "Select a day"}
            </h2>
            <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
              {dayContests.length === 0
                ? "No contests on this day"
                : `${dayContests.length} contest${dayContests.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </CardHeader>
        <CardBody className="space-y-2 pt-0">
          {dayContests.length === 0 ? (
            <EmptyState title="Nothing scheduled" className="py-8" />
          ) : (
            dayContests.map((c) => (
              <ContestRow key={`${c.platform}-${c.externalId}`} contest={c} />
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
