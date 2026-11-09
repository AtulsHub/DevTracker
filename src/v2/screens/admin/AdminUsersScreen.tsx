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
  const { confirm, dialog } = useConfirm();

  function load(query = q) {
    startTransition(async () => {
      try {
        setError(null);
        const res = await api<{ users: AdminUserRow[] }>(
          `/api/admin/users?q=${encodeURIComponent(query)}`,
        );
        setUsers(res.users);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
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
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader title="Users" />
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
            placeholder="username or email"
          />
        </div>
        <Button
          size="sm"
          className="self-end"
          loading={pending}
          type="submit"
        >
          Search
        </Button>
      </form>

      <Card>
        <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0">
          {users.length === 0 ? (
            <p className="px-4 py-8 text-center text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              No users found
            </p>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
                    <Link
                      href={`/u/${u.username}`}
                      className="text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                    >
                      @{u.username}
                    </Link>
                    {u.isAdmin ? (
                      <span className="ml-2 rounded bg-[var(--v2-primary-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--v2-primary)]">
                        admin
                      </span>
                    ) : null}
                    {u.disabledAt ? (
                      <span className="ml-2 rounded bg-[var(--v2-danger)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--v2-danger)]">
                        disabled
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-[11px] text-[var(--v2-fg-subtle)]">
                    {u.email}
                    {u.emailVerified ? "" : " · unverified"}
                    {u.discoverable ? "" : " · hidden"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={pending}
                    onClick={() =>
                      void patch(u.id, { disabled: !u.disabledAt })
                    }
                  >
                    {u.disabledAt ? "Enable" : "Disable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={pending}
                    onClick={() =>
                      void patch(u.id, { emailVerified: !u.emailVerified })
                    }
                  >
                    {u.emailVerified ? "Unverify" : "Verify"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={pending}
                    onClick={() =>
                      void patch(u.id, { discoverable: !u.discoverable })
                    }
                  >
                    {u.discoverable ? "Hide" : "Discover"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={pending}
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
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={pending}
                    onClick={() => void syncUser(u.id)}
                  >
                    Sync
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>
      {dialog}
    </div>
  );
}
