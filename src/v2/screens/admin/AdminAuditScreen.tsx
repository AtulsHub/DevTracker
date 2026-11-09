"use client";

import { useEffect, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import {
  AdminEmpty,
  AdminError,
  AdminShell,
  relativeTime,
} from "@/v2/components/admin/AdminShell";
import { Card, CardBody } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { api } from "@/v2/lib/api";
import { cn } from "@/v2/lib/cn";

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  actorId: string | null;
  actorUsername: string | null;
  actorEmail: string | null;
};

export function AdminAuditScreen() {
  const [entries, setEntries] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  function load() {
    startTransition(async () => {
      try {
        setError(null);
        const res = await api<{ entries: AuditRow[] }>("/api/admin/audit");
        setEntries(res.entries);
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

  return (
    <AdminShell
      title="Audit log"
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

      <Card className="overflow-hidden">
        <CardBody className="relative p-0">
          <div
            className="pointer-events-none absolute bottom-0 left-[1.35rem] top-0 w-px bg-[color-mix(in_srgb,var(--admin-teal)_35%,var(--v2-border))]"
            aria-hidden
          />
          {!loaded ? (
            <div className="space-y-2 p-4 pl-10">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="admin-skeleton h-14" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <AdminEmpty>No admin actions yet</AdminEmpty>
          ) : (
            <ul className="divide-y divide-[var(--v2-border-subtle)]">
              {entries.map((e) => (
                <li key={e.id} className="admin-row relative px-4 py-3.5 pl-10">
                  <span
                    className="absolute left-[1.1rem] top-5 size-2.5 rounded-full border-2 border-[var(--v2-bg-elevated)] bg-[var(--admin-teal)]"
                    aria-hidden
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
                      <span className="font-semibold">{e.action}</span>
                      <span className="text-[var(--v2-fg-subtle)]"> on </span>
                      <span className="font-medium">{e.entity}</span>
                      {e.entityId ? (
                        <span className="ml-1 font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                          {e.entityId.slice(0, 8)}…
                        </span>
                      ) : null}
                    </p>
                    <p
                      className="font-mono text-[11px] text-[var(--v2-fg-subtle)]"
                      title={new Date(e.createdAt).toLocaleString()}
                    >
                      {relativeTime(e.createdAt)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--v2-fg-muted)]">
                    {e.actorUsername
                      ? `@${e.actorUsername}`
                      : (e.actorEmail ?? "system")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </AdminShell>
  );
}
