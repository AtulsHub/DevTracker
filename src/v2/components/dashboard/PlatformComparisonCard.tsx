"use client";

import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { platformColor } from "@/v2/lib/platforms";
import { formatRelativeTime } from "@/lib/utils";

export type PlatformCompareRow = {
  platform: string;
  label: string;
  solvedCount: number;
  solvesInRange: number;
  streak: number;
  lastActive: string | null;
  avgRating: number | null;
};

export function PlatformComparisonCard({
  rows,
  rangeLabel,
}: {
  rows: PlatformCompareRow[];
  rangeLabel: string;
}) {
  if (rows.length < 2) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div>
          <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
            Platform comparison
          </h2>
          <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
            Side-by-side metrics · {rangeLabel}
          </p>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-left text-[var(--v2-text-sm)]">
            <thead>
              <tr className="border-b border-[var(--v2-border-subtle)] text-[11px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                <th className="py-2 pr-3 font-medium">Platform</th>
                <th className="py-2 pr-3 font-medium">In range</th>
                <th className="py-2 pr-3 font-medium">Total</th>
                <th className="py-2 pr-3 font-medium">Streak</th>
                <th className="py-2 pr-3 font-medium">Last active</th>
                <th className="py-2 font-medium">Avg rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.platform}
                  className="border-b border-[var(--v2-border-subtle)] last:border-0"
                >
                  <td className="py-2.5 pr-3">
                    <span className="inline-flex items-center gap-2 font-medium text-[var(--v2-fg)]">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: platformColor(r.platform) }}
                        aria-hidden
                      />
                      {r.label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 font-mono tabular-nums text-[var(--v2-fg)]">
                    {r.solvesInRange}
                  </td>
                  <td className="py-2.5 pr-3 font-mono tabular-nums text-[var(--v2-fg)]">
                    {r.solvedCount}
                  </td>
                  <td className="py-2.5 pr-3 font-mono tabular-nums text-[var(--v2-fg)]">
                    {r.streak}
                  </td>
                  <td className="py-2.5 pr-3 text-[var(--v2-fg-muted)]">
                    {r.lastActive
                      ? formatRelativeTime(`${r.lastActive}T12:00:00`)
                      : "—"}
                  </td>
                  <td className="py-2.5 font-mono tabular-nums text-[var(--v2-fg-muted)]">
                    {r.avgRating ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
