"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Activity,
  RefreshCw,
  Shield,
  UserMinus,
  Users,
  UsersRound,
} from "lucide-react";
import {
  AdminEmpty,
  AdminError,
  AdminShell,
  relativeTime,
} from "@/v2/components/admin/AdminShell";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { api } from "@/v2/lib/api";
import { cn } from "@/v2/lib/cn";

type Stats = {
  users: number;
  teams: number;
  disabledUsers: number;
  admins: number;
  platformAccounts: number;
  syncFailures24h: number;
  syncSuccess24h: number;
  recentUsers: Array<{
    id: string;
    username: string;
    email: string;
    createdAt: string;
  }>;
};

const TILES: {
  key: keyof Stats;
  label: string;
  href: string;
  accent: string;
  icon: typeof Users;
}[] = [
  { key: "users", label: "Users", href: "/admin/users", accent: "var(--admin-teal)", icon: Users },
  { key: "teams", label: "Teams", href: "/admin/teams", accent: "#0284c7", icon: UsersRound },
  {
    key: "disabledUsers",
    label: "Disabled",
    href: "/admin/users",
    accent: "var(--admin-rose)",
    icon: UserMinus,
  },
  { key: "admins", label: "Admins", href: "/admin/users", accent: "var(--admin-amber)", icon: Shield },
  {
    key: "platformAccounts",
    label: "Linked platforms",
    href: "/admin/sync",
    accent: "#7c3aed",
    icon: Activity,
  },
  {
    key: "syncSuccess24h",
    label: "Sync OK · 24h",
    href: "/admin/sync",
    accent: "var(--admin-teal)",
    icon: Activity,
  },
  {
    key: "syncFailures24h",
    label: "Sync fail · 24h",
    href: "/admin/sync",
    accent: "var(--admin-rose)",
    icon: Activity,
  },
];

export function AdminOverviewScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [refreshed, setRefreshed] = useState(false);

  function load() {
    startTransition(async () => {
      try {
        setError(null);
        const res = await api<{ stats: Stats }>("/api/admin/stats");
        setStats(res.stats);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function refreshContests() {
    startTransition(async () => {
      try {
        setError(null);
        setRefreshed(false);
        await api("/api/admin/contests/refresh", { method: "POST" });
        setRefreshed(true);
        load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Refresh failed");
      }
    });
  }

  return (
    <AdminShell
      title="Overview"
      actions={
        <Button
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() => void refreshContests()}
        >
          <RefreshCw
            className={cn("size-3.5", pending && "animate-spin")}
            aria-hidden
          />
          {refreshed ? "Contests refreshed" : "Refresh contests"}
        </Button>
      }
    >
      <AdminError message={error} />

      {!stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="admin-skeleton h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TILES.map((t) => {
            const Icon = t.icon;
            const value = stats[t.key];
            if (typeof value !== "number") return null;
            return (
              <Link key={t.label} href={t.href} className="no-underline">
                <Card
                  className="admin-metric h-full"
                  style={{ ["--admin-accent" as string]: t.accent }}
                >
                  <CardBody className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--v2-fg-subtle)]">
                        {t.label}
                      </p>
                      <span
                        className="flex size-7 items-center justify-center rounded-[var(--v2-radius-md)]"
                        style={{
                          background: `color-mix(in srgb, ${t.accent} 16%, transparent)`,
                          color: t.accent,
                        }}
                      >
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                    </div>
                    <p className="font-mono text-[1.75rem] font-semibold tabular-nums leading-none text-[var(--v2-fg)]">
                      {value.toLocaleString()}
                    </p>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Recent signups
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--v2-fg-subtle)]">
                Newest accounts on the platform
              </p>
            </div>
            <Link
              href="/admin/users"
              className="text-[var(--v2-text-xs)] font-medium text-[var(--admin-teal)] no-underline hover:underline"
            >
              Manage
            </Link>
          </CardHeader>
          <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0 pt-0">
            {!stats ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="admin-skeleton h-10" />
                ))}
              </div>
            ) : (stats.recentUsers ?? []).length === 0 ? (
              <AdminEmpty>No users yet</AdminEmpty>
            ) : (
              stats.recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="admin-row flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/u/${u.username}`}
                      className="truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)] no-underline hover:text-[var(--admin-teal)]"
                    >
                      @{u.username}
                    </Link>
                    <p className="truncate text-[11px] text-[var(--v2-fg-subtle)]">
                      {u.email}
                    </p>
                  </div>
                  <p
                    className="shrink-0 font-mono text-[11px] text-[var(--v2-fg-subtle)]"
                    title={new Date(u.createdAt).toLocaleString()}
                  >
                    {relativeTime(u.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Pulse
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--v2-fg-subtle)]">
                Last 24 hours
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-3 pt-0">
            {stats ? (
              <>
                <PulseBar
                  label="Sync success"
                  value={stats.syncSuccess24h}
                  total={Math.max(
                    stats.syncSuccess24h + stats.syncFailures24h,
                    1,
                  )}
                  tone="ok"
                />
                <PulseBar
                  label="Sync failures"
                  value={stats.syncFailures24h}
                  total={Math.max(
                    stats.syncSuccess24h + stats.syncFailures24h,
                    1,
                  )}
                  tone="bad"
                />
                <div className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border-subtle)] bg-[var(--v2-bg)]/40 px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                    Health
                  </p>
                  <p className="mt-1 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
                    {stats.syncFailures24h === 0
                      ? "All clear — no sync failures"
                      : `${stats.syncFailures24h} sync issue${stats.syncFailures24h === 1 ? "" : "s"} need attention`}
                  </p>
                  <Link
                    href="/admin/sync"
                    className="mt-2 inline-block text-[var(--v2-text-xs)] font-medium text-[var(--admin-teal)] no-underline hover:underline"
                  >
                    Open sync health
                  </Link>
                </div>
              </>
            ) : (
              <div className="admin-skeleton h-32" />
            )}
          </CardBody>
        </Card>
      </div>
    </AdminShell>
  );
}

function PulseBar({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "ok" | "bad";
}) {
  const pct = Math.min(100, Math.round((value / Math.max(total, 1)) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-[var(--v2-fg-muted)]">{label}</span>
        <span className="font-mono font-semibold tabular-nums text-[var(--v2-fg)]">
          {value}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--v2-bg-muted)]">
        <div
          className="h-full rounded-full transition-[width]"
          style={{
            width: `${pct}%`,
            background:
              tone === "ok" ? "var(--admin-teal)" : "var(--admin-rose)",
          }}
        />
      </div>
    </div>
  );
}
