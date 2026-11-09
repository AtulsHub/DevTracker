"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AdminEmpty,
  AdminError,
  AdminShell,
} from "@/v2/components/admin/AdminShell";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { api } from "@/v2/lib/api";
import { platformColor, platformLabel } from "@/v2/lib/platforms";
import { cn } from "@/v2/lib/cn";

type DayPoint = { date: string; count: number };

type Dashboard = {
  windowDays: number;
  totals: {
    users: number;
    verifiedUsers: number;
    disabledUsers: number;
    verifiedRate: number;
    teams: number;
    targets: number;
    activeTargets: number;
    solves: number;
    solvesInWindow: number;
    submissions: number;
    submissionsInWindow: number;
    contests: number;
    upcomingContests: number;
    platformAccounts: number;
    syncSuccess24h: number;
    syncFailures24h: number;
  };
  signupsByDay: DayPoint[];
  solvesByDay: DayPoint[];
  platforms: Array<{ platform: string; count: number }>;
  teamsByVisibility: Array<{ visibility: string; count: number }>;
  topSolvers: Array<{
    userId: string;
    username: string;
    displayName: string | null;
    solves: number;
  }>;
};

const DAY_OPTIONS = [7, 30, 90] as const;

function shortLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function AdminDashboardScreen() {
  const [days, setDays] = useState<(typeof DAY_OPTIONS)[number]>(30);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load(windowDays = days) {
    startTransition(async () => {
      try {
        setError(null);
        const res = await api<{ dashboard: Dashboard }>(
          `/api/admin/dashboard?days=${windowDays}`,
        );
        setData(res.dashboard);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    });
  }

  useEffect(() => {
    load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const signupChart = useMemo(
    () =>
      (data?.signupsByDay ?? []).map((d) => ({
        ...d,
        label: shortLabel(d.date),
      })),
    [data],
  );
  const solveChart = useMemo(
    () =>
      (data?.solvesByDay ?? []).map((d) => ({
        ...d,
        label: shortLabel(d.date),
      })),
    [data],
  );

  const t = data?.totals;

  return (
    <AdminShell
      title="Dashboard"
      eyebrow="Platform analytics"
      actions={
        <div className="flex rounded-full border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-0.5">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              disabled={pending}
              onClick={() => setDays(d)}
              className={cn(
                "min-h-8 rounded-full px-3 text-[11px] font-semibold transition-colors disabled:opacity-60",
                days === d
                  ? "bg-[var(--admin-teal)] text-white"
                  : "text-[var(--v2-fg-muted)] hover:text-[var(--v2-fg)]",
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      }
    >
      <AdminError message={error} />

      {!data || !t ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="admin-skeleton h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Users"
              value={t.users}
              hint={`${t.verifiedRate}% verified`}
              accent="var(--admin-teal)"
            />
            <Kpi
              label={`Solves · ${days}d`}
              value={t.solvesInWindow}
              hint={`${t.solves.toLocaleString()} all time`}
              accent="#0284c7"
            />
            <Kpi
              label={`Submissions · ${days}d`}
              value={t.submissionsInWindow}
              hint={`${t.submissions.toLocaleString()} all time`}
              accent="var(--admin-amber)"
            />
            <Kpi
              label="Upcoming contests"
              value={t.upcomingContests}
              hint={`${t.contests.toLocaleString()} catalogued`}
              accent="#7c3aed"
            />
            <Kpi
              label="Teams"
              value={t.teams}
              hint={`${t.activeTargets} active targets`}
              accent="#0f766e"
            />
            <Kpi
              label="Platforms linked"
              value={t.platformAccounts}
              hint={`${t.disabledUsers} disabled users`}
              accent="#b45309"
            />
            <Kpi
              label="Sync OK · 24h"
              value={t.syncSuccess24h}
              hint="Successful runs"
              accent="var(--admin-teal)"
            />
            <Kpi
              label="Sync fail · 24h"
              value={t.syncFailures24h}
              hint="Errors + degraded"
              accent="var(--admin-rose)"
            />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <ChartCard title="New signups" subtitle={`Last ${days} days`}>
              {signupChart.every((d) => d.count === 0) ? (
                <AdminEmpty>No signups in this window</AdminEmpty>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={signupChart}
                      margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="adminSignupFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--admin-teal)"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--admin-teal)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--v2-border)"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "var(--v2-fg-subtle)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "var(--v2-fg-subtle)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: "var(--v2-fg)" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Signups"
                        stroke="var(--admin-teal)"
                        fill="url(#adminSignupFill)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard title="First solves" subtitle={`Last ${days} days`}>
              {solveChart.every((d) => d.count === 0) ? (
                <AdminEmpty>No solves in this window</AdminEmpty>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={solveChart}
                      margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--v2-border)"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "var(--v2-fg-subtle)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "var(--v2-fg-subtle)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: "var(--v2-fg)" }}
                      />
                      <Bar
                        dataKey="count"
                        name="Solves"
                        fill="#0284c7"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <ChartCard title="Linked platforms" subtitle="Accounts by site">
              {(data.platforms ?? []).length === 0 ? (
                <AdminEmpty>No platforms linked yet</AdminEmpty>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.platforms.map((p) => ({
                        ...p,
                        label: platformLabel(p.platform),
                      }))}
                      layout="vertical"
                      margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid
                        horizontal={false}
                        stroke="var(--v2-border)"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fill: "var(--v2-fg-subtle)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={88}
                        tick={{ fill: "var(--v2-fg-muted)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Accounts" radius={[0, 4, 4, 0]}>
                        {data.platforms.map((p) => (
                          <Cell
                            key={p.platform}
                            fill={platformColor(p.platform)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <Card>
              <CardHeader>
                <div>
                  <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                    Top solvers
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[var(--v2-fg-subtle)]">
                    First solves in the last {days} days
                  </p>
                </div>
              </CardHeader>
              <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0 pt-0">
                {data.topSolvers.length === 0 ? (
                  <AdminEmpty>No solve activity yet</AdminEmpty>
                ) : (
                  data.topSolvers.map((u, idx) => (
                    <div
                      key={u.userId}
                      className="admin-row flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/u/${u.username}`}
                            className="truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)] no-underline hover:text-[var(--admin-teal)]"
                          >
                            {u.displayName ?? `@${u.username}`}
                          </Link>
                          <p className="truncate text-[11px] text-[var(--v2-fg-subtle)]">
                            @{u.username}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[var(--v2-text-sm)] font-semibold tabular-nums text-[var(--v2-fg)]">
                        {u.solves}
                      </span>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>

          {(data.teamsByVisibility.length > 0 || t.targets > 0) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {data.teamsByVisibility.map((row) => (
                <Card key={row.visibility} className="admin-metric">
                  <CardBody>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                      {row.visibility.toLowerCase()} teams
                    </p>
                    <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--v2-fg)]">
                      {row.count}
                    </p>
                  </CardBody>
                </Card>
              ))}
              <Card className="admin-metric">
                <CardBody>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                    Targets
                  </p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--v2-fg)]">
                    {t.activeTargets}
                    <span className="ml-1 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)]">
                      / {t.targets}
                    </span>
                  </p>
                </CardBody>
              </Card>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}

const tooltipStyle = {
  background: "var(--v2-bg-elevated)",
  border: "1px solid var(--v2-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--v2-fg)",
};

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint: string;
  accent: string;
}) {
  return (
    <Card
      className="admin-metric"
      style={{ ["--admin-accent" as string]: accent }}
    >
      <CardBody>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--v2-fg-subtle)]">
          {label}
        </p>
        <p className="mt-1.5 font-mono text-[1.65rem] font-semibold tabular-nums leading-none text-[var(--v2-fg)]">
          {value.toLocaleString()}
        </p>
        <p className="mt-2 text-[11px] text-[var(--v2-fg-muted)]">{hint}</p>
      </CardBody>
    </Card>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
            {title}
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--v2-fg-subtle)]">
            {subtitle}
          </p>
        </div>
      </CardHeader>
      <CardBody className="pt-2">{children}</CardBody>
    </Card>
  );
}
