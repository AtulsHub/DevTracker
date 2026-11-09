"use client";

import { useEffect, useState, useTransition } from "react";
import { AdminNav } from "@/v2/components/admin/AdminNav";
import { PageHeader } from "@/v2/components/PageHeader";
import { Card, CardBody } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { api } from "@/v2/lib/api";

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

  function load() {
    startTransition(async () => {
      try {
        setError(null);
        const res = await api<{ entries: AuditRow[] }>("/api/admin/audit");
        setEntries(res.entries);
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
        title="Audit log"
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
          {entries.length === 0 ? (
            <p className="px-4 py-8 text-center text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              No admin actions yet
            </p>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
                    <span className="font-medium">{e.action}</span>
                    {" · "}
                    {e.entity}
                    {e.entityId ? (
                      <span className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                        {" "}
                        {e.entityId.slice(0, 8)}…
                      </span>
                    ) : null}
                  </p>
                  <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                    {new Date(e.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--v2-fg-muted)]">
                  {e.actorUsername
                    ? `@${e.actorUsername}`
                    : (e.actorEmail ?? "system")}
                </p>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
