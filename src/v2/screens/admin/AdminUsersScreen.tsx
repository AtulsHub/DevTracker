"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
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
import { cn } from "@/v2/lib/cn";

type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
  disabledAt: string | null;
  emailVerified: string | null;
  discoverable: boolean;
  profileVisibility: string;
  createdAt: string;
};

export function AdminUsersScreen() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const { confirm, dialog } = useConfirm();

  function load(query = q) {
    startTransition(async () => {
      try {
        setError(null);
        const res = await api<{ users: AdminUserRow[] }>(
          `/api/admin/users?q=${encodeURIComponent(query)}`,
        );
        setUsers(res.users);
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

  async function patch(id: string, body: Record<string, boolean>) {
    startTransition(async () => {
      try {
        setError(null);
        await api(`/api/admin/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  async function syncUser(id: string) {
    startTransition(async () => {
      try {
        setError(null);
        await api(`/api/admin/users/${id}/sync`, { method: "POST" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sync failed");
      }
    });
  }

  return (
    <AdminShell title="Users">
      <AdminError message={error} />

      <form
        className="mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <label className="relative block">
          <span className="sr-only">Search users</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--v2-fg-subtle)]"
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search username or email"
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
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="admin-skeleton h-16" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <AdminEmpty>No users found</AdminEmpty>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="admin-row flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/u/${u.username}`}
                      className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)] no-underline hover:text-[var(--admin-teal)]"
                    >
                      @{u.username}
                    </Link>
                    {u.isAdmin ? (
                      <span className="admin-status admin-status-warn">
                        admin
                      </span>
                    ) : null}
                    {u.disabledAt ? (
                      <span className="admin-status admin-status-bad">
                        disabled
                      </span>
                    ) : (
                      <span className="admin-status admin-status-ok">
                        active
                      </span>
                    )}
                    {!u.emailVerified ? (
                      <span className="admin-status admin-status-muted">
                        unverified
                      </span>
                    ) : null}
                    {!u.discoverable ? (
                      <span className="admin-status admin-status-muted">
                        hidden
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--v2-fg-subtle)]">
                    {u.email}
                    <span className="mx-1.5 opacity-40">·</span>
                    <span title={new Date(u.createdAt).toLocaleString()}>
                      joined {relativeTime(u.createdAt)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <ActionChip
                    pending={pending}
                    onClick={() => void patch(u.id, { disabled: !u.disabledAt })}
                    danger={!u.disabledAt}
                  >
                    {u.disabledAt ? "Enable" : "Disable"}
                  </ActionChip>
                  <ActionChip
                    pending={pending}
                    onClick={() =>
                      void patch(u.id, { emailVerified: !u.emailVerified })
                    }
                  >
                    {u.emailVerified ? "Unverify" : "Verify"}
                  </ActionChip>
                  <ActionChip
                    pending={pending}
                    onClick={() =>
                      void patch(u.id, { discoverable: !u.discoverable })
                    }
                  >
                    {u.discoverable ? "Hide" : "Discover"}
                  </ActionChip>
                  <ActionChip
                    pending={pending}
                    onClick={() =>
                      void (async () => {
                        const ok = await confirm({
                          title: u.isAdmin
                            ? `Remove admin from @${u.username}?`
                            : `Make @${u.username} an admin?`,
                          confirmLabel: u.isAdmin ? "Remove" : "Promote",
                          danger: u.isAdmin,
                        });
                        if (ok) void patch(u.id, { isAdmin: !u.isAdmin });
                      })()
                    }
                  >
                    {u.isAdmin ? "Demote" : "Promote"}
                  </ActionChip>
                  <ActionChip
                    pending={pending}
                    solid
                    onClick={() => void syncUser(u.id)}
                  >
                    Sync
                  </ActionChip>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>
      {dialog}
    </AdminShell>
  );
}

function ActionChip({
  children,
  onClick,
  pending,
  danger,
  solid,
}: {
  children: React.ReactNode;
  onClick: () => void;
  pending?: boolean;
  danger?: boolean;
  solid?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={cn(
        "min-h-8 rounded-full border px-2.5 text-[11px] font-semibold transition-colors disabled:opacity-50",
        solid
          ? "border-transparent bg-[var(--admin-teal)] text-white hover:brightness-110"
          : danger
            ? "border-[var(--admin-rose)]/30 text-[var(--admin-rose)] hover:bg-[var(--admin-rose-soft)]"
            : "border-[var(--v2-border)] text-[var(--v2-fg-muted)] hover:border-[var(--admin-teal)]/40 hover:text-[var(--v2-fg)]",
      )}
    >
      {children}
    </button>
  );
}
