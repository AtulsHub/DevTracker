"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/v2/components/EmptyState";
import { platformColor, platformLabel } from "@/v2/lib/platforms";

type Day = { date: string; count: number };

function shortLabel(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

export function ActivityChart({
  data,
  seriesByPlatform,
  compare = false,
  emptyActions,
}: {
  data: Day[];
  seriesByPlatform?: Record<string, Day[]>;
  compare?: boolean;
  emptyActions?: React.ReactNode;
}) {
  const platformIds = useMemo(
    () => Object.keys(seriesByPlatform ?? {}),
    [seriesByPlatform],
  );
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const chartData = useMemo(() => {
    if (compare && seriesByPlatform && platformIds.length > 0) {
      const dates =
        data.length > 0
          ? data.map((d) => d.date)
          : (seriesByPlatform[platformIds[0]!] ?? []).map((d) => d.date);
      return dates.map((date) => {
        const row: Record<string, string | number> = {
          date,
          label: shortLabel(date),
        };
        for (const id of platformIds) {
          const day = seriesByPlatform[id]?.find((d) => d.date === date);
          row[id] = day?.count ?? 0;
        }
        return row;
      });
    }
    return data.map((d) => ({
      date: d.date,
      label: shortLabel(d.date),
      solves: d.count,
    }));
  }, [compare, data, platformIds, seriesByPlatform]);

  const hasActivity = compare
    ? chartData.some((row) =>
        platformIds.some((id) => Number(row[id] ?? 0) > 0),
      )
    : chartData.some((d) => Number(d.solves ?? 0) > 0);

  if (!hasActivity) {
    return (
      <EmptyState
        title="No solves in this period"
        className="py-10"
        action={emptyActions}
      />
    );
  }

  return (
    <div
      className="h-56 w-full min-h-[14rem]"
      role="img"
      aria-label="Daily solves chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 4, left: -18, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--v2-border)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--v2-fg-subtle)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--v2-fg-subtle)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            cursor={{ fill: "var(--v2-primary-muted)" }}
            contentStyle={{
              background: "var(--v2-bg-elevated)",
              border: "1px solid var(--v2-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--v2-fg)",
              boxShadow: "var(--v2-shadow-md)",
            }}
            labelStyle={{ color: "var(--v2-fg-muted)" }}
          />
          {compare ? (
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              onClick={(e) => {
                const key = String(e.dataKey);
                setHidden((h) => ({ ...h, [key]: !h[key] }));
              }}
            />
          ) : null}
          {compare
            ? platformIds
                .filter((id) => !hidden[id])
                .map((id) => (
                  <Bar
                    key={id}
                    dataKey={id}
                    name={platformLabel(id)}
                    fill={platformColor(id)}
                    stackId="a"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={28}
                  />
                ))
            : (
                <Bar
                  dataKey="solves"
                  name="Solves"
                  fill="var(--v2-primary)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
