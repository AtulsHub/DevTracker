"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
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

type SyncRow = {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  itemsFetched: number | null;
  error: string | null;
  platform: string;
  handle: string;
  userId: string;
  username: string;
};

export function AdminSyncScreen() {
  const [runs, setRuns] = useState<SyncRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | "success" | "problem">("all");

  function load() {
    startTransition(async () => {
      try {
        setError(null);
        const res = await api<{ runs: SyncRow[] }>("/api/admin/sync");
        setRuns(res.runs);
        setLoaded(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
        setLoaded(true);
      }
    });
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "success") return runs.filter((r) => r.status === "success");
    if (filter === "problem") {
      return runs.filter(
        (r) => r.status === "error" || r.status === "degraded",
      );
    }
    return runs;
  }, [runs, filter]);

  const counts = useMemo(() => {
    let ok = 0;
    let bad = 0;
    for (const r of runs) {
      if (r.status === "success") ok += 1;
      else if (r.status === "error" || r.status === "degraded") bad += 1;
    }
    return { ok, bad, all: runs.length };
  }, [runs]);

  return (
    <AdminShell
      title="Sync health"
      actions={
        <Button
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={load}
        >
          <RefreshCw className={cn("size-3.5", pending && "animate-spin")} aria-hidden />
          Reload
        </Button>
      }
    >
      <AdminError message={error} />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["all", `All (${counts.all})`],
            ["success", `OK (${counts.ok})`],
            ["problem", `Issues (${counts.bad})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
              filter === id
                ? "border-transparent bg-[var(--admin-teal)] text-white"
                : "border-[var(--v2-border)] text-[var(--v2-fg-muted)] hover:text-[var(--v2-fg)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[var(--v2-border-subtle)]">
          <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
            Recent runs
          </h2>
        </CardHeader>
        <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0">
          {!loaded ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="admin-skeleton h-14" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <AdminEmpty>No sync runs match</AdminEmpty>
          ) : (
            filtered.map((r) => (
              <div key={r.id} className="admin-row px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
                      <span className="font-semibold capitalize">
                        {r.platform}
                      </span>
                      <span className="text-[var(--v2-fg-subtle)]"> · </span>
                      <span className="font-mono text-[12px]">{r.handle}</span>
                      <span className="text-[var(--v2-fg-subtle)]"> · </span>
                      <Link
                        href={`/u/${r.username}`}
                        className="font-medium text-[var(--admin-teal)] no-underline hover:underline"
                      >
                        @{r.username}
                      </Link>
                    </p>
                    <p
                      className="mt-0.5 font-mono text-[11px] text-[var(--v2-fg-subtle)]"
                      title={new Date(r.startedAt).toLocaleString()}
                    >
                      {relativeTime(r.startedAt)}
                      {r.itemsFetched != null
                        ? ` · ${r.itemsFetched} items`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "admin-status",
                      r.status === "success"
                        ? "admin-status-ok"
                        : r.status === "error" || r.status === "degraded"
                          ? "admin-status-bad"
                          : "admin-status-muted",
                    )}
                  >
                    {r.status}
                  </span>
                </div>
                {r.error ? (
                  <p className="mt-1.5 line-clamp-2 rounded-[var(--v2-radius-md)] bg-[var(--admin-rose-soft)] px-2.5 py-1.5 text-[11px] text-[var(--admin-rose)]">
                    {r.error}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </AdminShell>
  );
}
