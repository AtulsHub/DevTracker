"use client";

import { useMemo, useState } from "react";
import { cn } from "@/v2/lib/cn";
import { platformColor, platformLabel } from "@/v2/lib/platforms";

type Day = { date: string; count: number };

const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

function levelFor(count: number, max: number) {
  if (count <= 0) return 0;
  if (max <= 1) return 3;
  return Math.min(4, Math.ceil((count / max) * 4));
}

function formatDateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type HeatmapPlatformBreakdown = Record<
  string,
  Array<{ date: string; count: number }>
>;

/**
 * LeetCode-style contribution heatmap: year grid, month labels,
 * Mon/Wed/Fri, green intensity, hover tooltips (with per-platform breakdown).
 */
export function ActivityHeatmap({
  data,
  className,
  title,
  byPlatform,
}: {
  data: Day[];
  className?: string;
  title?: React.ReactNode;
  /** When multiple platforms are in view, tooltip lists each platform's count. */
  byPlatform?: HeatmapPlatformBreakdown;
}) {
  const [hover, setHover] = useState<{
    date: string;
    x: number;
    y: number;
  } | null>(null);

  const platformIds = useMemo(
    () => Object.keys(byPlatform ?? {}),
    [byPlatform],
  );

  const byPlatformMaps = useMemo(() => {
    const maps: Record<string, Map<string, number>> = {};
    for (const id of platformIds) {
      maps[id] = new Map(
        (byPlatform?.[id] ?? []).map((d) => [d.date, d.count]),
      );
    }
    return maps;
  }, [byPlatform, platformIds]);

  const { weeks, max, monthLabels, total } = useMemo(() => {
    if (data.length === 0) {
      return {
        weeks: [] as Day[][],
        max: 1,
        monthLabels: [] as string[],
        total: 0,
      };
    }

    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const totalCount = data.reduce((s, d) => s + d.count, 0);

    const first = new Date(`${data[0]!.date}T12:00:00`);
    const pad = first.getDay();
    const padded: Array<Day | null> = [
      ...Array.from({ length: pad }, () => null),
      ...data,
    ];

    const cols: Day[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      const slice = padded.slice(i, i + 7);
      while (slice.length < 7) slice.push(null);
      cols.push(slice.map((d) => d ?? { date: "", count: -1 }));
    }

    const labels: string[] = [];
    let lastMonth = -1;
    cols.forEach((week) => {
      const day = week.find((d) => d.count >= 0 && d.date);
      if (!day?.date) {
        labels.push("");
        return;
      }
      const m = new Date(`${day.date}T12:00:00`).getMonth();
      if (m !== lastMonth) {
        labels.push(
          new Date(`${day.date}T12:00:00`).toLocaleString("en", {
            month: "short",
          }),
        );
        lastMonth = m;
      } else {
        labels.push("");
      }
    });

    return {
      weeks: cols,
      max: maxCount,
      monthLabels: labels,
      total: totalCount,
    };
  }, [data]);

  const hoverBreakdown = useMemo(() => {
    if (!hover) return null;
    const day = data.find((d) => d.date === hover.date);
    const totalDay = day?.count ?? 0;
    const parts =
      platformIds.length > 1
        ? platformIds
            .map((id) => ({
              id,
              label: platformLabel(id),
              count: byPlatformMaps[id]?.get(hover.date) ?? 0,
              color: platformColor(id),
            }))
            .filter((p) => p.count > 0)
        : [];
    return { totalDay, parts, label: formatDateLabel(hover.date) };
  }, [hover, data, platformIds, byPlatformMaps]);

  if (data.length === 0) {
    return (
      <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
        No activity data yet. Sync your platforms to fill the heatmap.
      </p>
    );
  }

  const cell = weeks.length > 70 ? 10 : 12;
  const gap = 3;

  function ariaFor(date: string, count: number) {
    const label = formatDateLabel(date);
    if (count <= 0) return `No submissions on ${label}`;
    if (platformIds.length <= 1) {
      return `${count} submission${count === 1 ? "" : "s"} on ${label}`;
    }
    const parts = platformIds
      .map((id) => {
        const n = byPlatformMaps[id]?.get(date) ?? 0;
        return n > 0 ? `${platformLabel(id)} ${n}` : null;
      })
      .filter(Boolean);
    return `${count} on ${label}${parts.length ? `: ${parts.join(", ")}` : ""}`;
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
          {title ?? (
            <>
              <span className="font-semibold tabular-nums">
                {total.toLocaleString()}
              </span>{" "}
              submission{total === 1 ? "" : "s"} in this range
            </>
          )}
        </p>
      </div>

      <div className="w-full overflow-x-auto pb-1">
        <div className="inline-block min-w-max">
          <div
            className="mb-1.5 grid"
            style={{
              gap,
              gridTemplateColumns: `32px repeat(${weeks.length}, ${cell}px)`,
            }}
          >
            <span />
            {monthLabels.map((label, i) => (
              <span
                key={`m-${i}`}
                className="text-[11px] leading-none text-[var(--v2-fg-subtle)]"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex" style={{ gap }}>
            <div className="flex flex-col" style={{ gap }}>
              {WEEKDAYS.map((d, i) => (
                <span
                  key={i}
                  className="flex items-center text-[11px] leading-none text-[var(--v2-fg-subtle)]"
                  style={{ height: cell }}
                >
                  {d}
                </span>
              ))}
            </div>
            <div
              className="grid"
              style={{
                gap,
                gridTemplateColumns: `repeat(${weeks.length}, ${cell}px)`,
                gridTemplateRows: `repeat(7, ${cell}px)`,
                gridAutoFlow: "column",
              }}
              role="img"
              aria-label="Submission activity heatmap"
            >
              {weeks.flatMap((week, wi) =>
                week.map((day, di) => {
                  if (day.count < 0 || !day.date) {
                    return (
                      <span
                        key={`${wi}-${di}`}
                        className="rounded-[2px] bg-transparent"
                        style={{ width: cell, height: cell }}
                      />
                    );
                  }
                  const level = levelFor(day.count, max);
                  return (
                    <button
                      key={day.date}
                      type="button"
                      aria-label={ariaFor(day.date, day.count)}
                      onMouseEnter={(e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        setHover({
                          date: day.date,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHover(null)}
                      onFocus={(e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        setHover({
                          date: day.date,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onBlur={() => setHover(null)}
                      className="rounded-[2px] outline-none ring-offset-1 focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]"
                      style={{
                        width: cell,
                        height: cell,
                        background: `var(--v2-heat-${level})`,
                      }}
                    />
                  );
                }),
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-[var(--v2-fg-subtle)]">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className="rounded-[2px]"
                style={{
                  width: cell - 1,
                  height: cell - 1,
                  background: `var(--v2-heat-${level})`,
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {hover && hoverBreakdown ? (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 min-w-[10rem] -translate-x-1/2 -translate-y-full rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] px-3 py-2 text-[var(--v2-text-xs)] shadow-[var(--v2-shadow-md)]"
          style={{
            left: hover.x,
            top: hover.y - 8,
          }}
        >
          <p className="font-medium text-[var(--v2-fg)]">
            {hoverBreakdown.label}
          </p>
          <p className="mt-0.5 text-[var(--v2-fg-muted)]">
            {hoverBreakdown.totalDay === 0
              ? "No submissions"
              : `${hoverBreakdown.totalDay} submission${hoverBreakdown.totalDay === 1 ? "" : "s"}`}
          </p>
          {hoverBreakdown.parts.length > 0 ? (
            <ul className="mt-1.5 space-y-1 border-t border-[var(--v2-border-subtle)] pt-1.5">
              {hoverBreakdown.parts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 text-[var(--v2-fg)]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: p.color }}
                      aria-hidden
                    />
                    {p.label}
                  </span>
                  <span className="font-mono tabular-nums">{p.count}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
