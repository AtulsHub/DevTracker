"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AdminNav } from "@/v2/components/admin/AdminNav";
import { PageHeader } from "@/v2/components/PageHeader";
import { Card, CardBody } from "@/v2/components/Card";
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

  function load() {
    startTransition(async () => {
      try {
        setError(null);
        const res = await api<{ runs: SyncRow[] }>("/api/admin/sync");
        setRuns(res.runs);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    });
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader
        title="Sync health"
        actions={
          <Button size="sm" variant="secondary" loading={pending} onClick={load}>
            Reload
          </Button>
        }
      />
      <AdminNav />
      {error ? (
        <p className="mb-4 text-[var(--v2-text-sm)] text-[var(--v2-danger)]">
          {error}
        </p>
      ) : null}

      <Card>
        <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0">
          {runs.length === 0 ? (
            <p className="px-4 py-8 text-center text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              No sync runs yet
            </p>
          ) : (
            runs.map((r) => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
                      <span className="font-medium capitalize">{r.platform}</span>
                      {" · "}
                      {r.handle}
                      {" · "}
                      <Link
                        href={`/u/${r.username}`}
                        className="text-[var(--v2-primary)] no-underline hover:underline"
                      >
                        @{r.username}
                      </Link>
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                      {new Date(r.startedAt).toLocaleString()}
                      {r.itemsFetched != null ? ` · ${r.itemsFetched} items` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[11px] font-semibold capitalize",
                      r.status === "success"
                        ? "bg-[var(--v2-success)]/10 text-[var(--v2-success)]"
                        : r.status === "error" || r.status === "degraded"
                          ? "bg-[var(--v2-danger)]/10 text-[var(--v2-danger)]"
                          : "bg-[var(--v2-bg-muted)] text-[var(--v2-fg-muted)]",
                    )}
                  >
                    {r.status}
                  </span>
                </div>
                {r.error ? (
                  <p className="mt-1 line-clamp-2 text-[11px] text-[var(--v2-danger)]">
                    {r.error}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
