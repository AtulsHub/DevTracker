"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { AdminNav } from "@/v2/components/admin/AdminNav";
import { PageHeader } from "@/v2/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { api } from "@/v2/lib/api";

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

export function AdminOverviewScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        await api("/api/admin/contests/refresh", { method: "POST" });
        load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Refresh failed");
      }
    });
  }

  const tiles = stats
    ? [
        { label: "Users", value: stats.users, href: "/admin/users" },
        { label: "Teams", value: stats.teams, href: "/admin/teams" },
        { label: "Disabled", value: stats.disabledUsers, href: "/admin/users" },
        { label: "Admins", value: stats.admins, href: "/admin/users" },
        {
          label: "Platforms linked",
          value: stats.platformAccounts,
          href: "/admin/sync",
        },
        {
          label: "Sync OK (24h)",
          value: stats.syncSuccess24h,
          href: "/admin/sync",
        },
        {
          label: "Sync fail (24h)",
          value: stats.syncFailures24h,
          href: "/admin/sync",
        },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader
        title="Admin"
        actions={
          <Button
            size="sm"
            variant="secondary"
            loading={pending}
            onClick={() => void refreshContests()}
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Refresh contests
          </Button>
        }
      />
      <AdminNav />
      {error ? (
        <p className="mb-4 text-[var(--v2-text-sm)] text-[var(--v2-danger)]">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="no-underline">
            <Card className="h-full transition-colors hover:border-[var(--v2-border-strong)]">
              <CardBody>
                <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                  {t.label}
                </p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--v2-fg)]">
                  {t.value}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
            Recent signups
          </h2>
        </CardHeader>
        <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0 pt-0">
          {(stats?.recentUsers ?? []).length === 0 ? (
            <p className="px-4 py-6 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              No users yet
            </p>
          ) : (
            stats?.recentUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
                    @{u.username}
                  </p>
                  <p className="truncate text-[11px] text-[var(--v2-fg-subtle)]">
                    {u.email}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                  {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
