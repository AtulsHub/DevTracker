"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Search, Trash2 } from "lucide-react";
import {
  AdminEmpty,
  AdminError,
  AdminShell,
  relativeTime,
} from "@/v2/components/admin/AdminShell";
import { Card, CardBody } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
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
  const [loaded, setLoaded] = useState(false);
  const { confirm, dialog } = useConfirm();

  function load(query = q) {
    startTransition(async () => {
      try {
        setError(null);
        const res = await api<{ teams: TeamRow[] }>(
          `/api/admin/teams?q=${encodeURIComponent(query)}`,
        );
        setTeams(res.teams);
        setLoaded(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
        setLoaded(true);
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
    <AdminShell title="Teams">
      <AdminError message={error} />

      <form
        className="mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <label className="relative block">
          <span className="sr-only">Search teams</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--v2-fg-subtle)]"
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or slug"
            className="min-h-11 w-full rounded-full border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] py-2 pl-10 pr-24 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--admin-teal)]"
          />
          <Button
            size="sm"
            type="submit"
            loading={pending}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"
          >
            Search
          </Button>
        </label>
      </form>

      <Card className="overflow-hidden">
        <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0">
          {!loaded ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="admin-skeleton h-14" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <AdminEmpty>No teams found</AdminEmpty>
          ) : (
            teams.map((t) => (
              <div
                key={t.id}
                className="admin-row flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/teams/${t.slug}`}
                      className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)] no-underline hover:text-[var(--admin-teal)]"
                    >
                      {t.name}
                    </Link>
                    <span
                      className={
                        t.visibility === "PUBLIC"
                          ? "admin-status admin-status-ok"
                          : t.visibility === "SECRET"
                            ? "admin-status admin-status-bad"
                            : "admin-status admin-status-warn"
                      }
                    >
                      {t.visibility.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--v2-fg-subtle)]">
                    /{t.slug}
                    <span className="mx-1.5 opacity-40">·</span>
                    <span title={new Date(t.createdAt).toLocaleString()}>
                      {relativeTime(t.createdAt)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void remove(t)}
                  className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-full border border-[var(--admin-rose)]/30 px-2.5 text-[11px] font-semibold text-[var(--admin-rose)] transition-colors hover:bg-[var(--admin-rose-soft)] disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete
                </button>
              </div>
            ))
          )}
        </CardBody>
      </Card>
      {dialog}
    </AdminShell>
  );
}
