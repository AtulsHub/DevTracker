"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AdminNav } from "@/v2/components/admin/AdminNav";
import { PageHeader } from "@/v2/components/PageHeader";
import { Card, CardBody } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { api } from "@/v2/lib/api";
import { useConfirm } from "@/v2/feedback/useConfirm";

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  visibility: string;
  ownerId: string;
  createdAt: string;
};

export function AdminTeamsScreen() {
  const [q, setQ] = useState("");
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();

  function load(query = q) {
    startTransition(async () => {
      try {
        setError(null);
        const res = await api<{ teams: TeamRow[] }>(
          `/api/admin/teams?q=${encodeURIComponent(query)}`,
        );
        setTeams(res.teams);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    });
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(team: TeamRow) {
    const ok = await confirm({
      title: `Delete team “${team.name}”?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        setError(null);
        await api(`/api/admin/teams/${team.id}`, { method: "DELETE" });
        load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader title="Teams" />
      <AdminNav />
      {error ? (
        <p className="mb-4 text-[var(--v2-text-sm)] text-[var(--v2-danger)]">
          {error}
        </p>
      ) : null}

      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <div className="min-w-[12rem] flex-1">
          <Input
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="name or slug"
          />
        </div>
        <Button size="sm" className="self-end" loading={pending} type="submit">
          Search
        </Button>
      </form>

      <Card>
        <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0">
          {teams.length === 0 ? (
            <p className="px-4 py-8 text-center text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              No teams found
            </p>
          ) : (
            teams.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/teams/${t.slug}`}
                    className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                  >
                    {t.name}
                  </Link>
                  <p className="text-[11px] text-[var(--v2-fg-subtle)]">
                    /{t.slug} · {t.visibility.toLowerCase()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={pending}
                  onClick={() => void remove(t)}
                >
                  Delete
                </Button>
              </div>
            ))
          )}
        </CardBody>
      </Card>
      {dialog}
    </div>
  );
}
