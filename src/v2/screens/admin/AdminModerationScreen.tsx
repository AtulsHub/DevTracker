"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  AdminEmpty,
  AdminError,
  AdminShell,
  relativeTime,
} from "@/v2/components/admin/AdminShell";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { api } from "@/v2/lib/api";
import { useConfirm } from "@/v2/feedback/useConfirm";

type FlaggedUser = {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  headline: string | null;
  avatarUrl: string | null;
  updatedAt: string;
};

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  teamId: string;
  teamName: string;
  teamSlug: string;
  authorUsername: string;
};

export function AdminModerationScreen() {
  const [users, setUsers] = useState<FlaggedUser[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const { confirm, dialog } = useConfirm();

  function load() {
    startTransition(async () => {
      try {
        setError(null);
        const res = await api<{
          flaggedUsers: FlaggedUser[];
          recentAnnouncements: AnnouncementRow[];
        }>("/api/admin/moderation");
        setUsers(res.flaggedUsers);
        setAnnouncements(res.recentAnnouncements);
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

  async function clearUser(
    id: string,
    patch: { clearBio?: boolean; clearAvatar?: boolean; clearHeadline?: boolean },
  ) {
    startTransition(async () => {
      try {
        setError(null);
        await api(`/api/admin/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  async function removeAnnouncement(row: AnnouncementRow) {
    const ok = await confirm({
      title: `Remove “${row.title}”?`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        setError(null);
        await api(`/api/admin/announcements/${row.id}`, { method: "DELETE" });
        load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <AdminShell
      title="Moderation"
      eyebrow="Content safety"
      actions={
        <Button size="sm" variant="secondary" loading={pending} onClick={load}>
          Reload
        </Button>
      }
    >
      <AdminError message={error} />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Profile content
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--v2-fg-subtle)]">
                Clear bio, headline, or avatar
              </p>
            </div>
          </CardHeader>
          <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0 pt-0">
            {!loaded ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="admin-skeleton h-16" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <AdminEmpty>No profile content to review</AdminEmpty>
            ) : (
              users.map((u) => (
                <div key={u.id} className="admin-row space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/u/${u.username}`}
                        className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)] no-underline hover:text-[var(--admin-teal)]"
                      >
                        @{u.username}
                      </Link>
                      <p className="text-[11px] text-[var(--v2-fg-subtle)]">
                        {relativeTime(u.updatedAt)}
                      </p>
                    </div>
                    {u.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="size-10 rounded-full object-cover ring-1 ring-[var(--v2-border)]"
                      />
                    ) : null}
                  </div>
                  {u.headline ? (
                    <p className="text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                      {u.headline}
                    </p>
                  ) : null}
                  {u.bio ? (
                    <p className="line-clamp-3 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                      {u.bio}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5">
                    {u.bio ? (
                      <ModChip
                        pending={pending}
                        onClick={() => void clearUser(u.id, { clearBio: true })}
                      >
                        Clear bio
                      </ModChip>
                    ) : null}
                    {u.headline ? (
                      <ModChip
                        pending={pending}
                        onClick={() =>
                          void clearUser(u.id, { clearHeadline: true })
                        }
                      >
                        Clear headline
                      </ModChip>
                    ) : null}
                    {u.avatarUrl ? (
                      <ModChip
                        pending={pending}
                        onClick={() =>
                          void clearUser(u.id, { clearAvatar: true })
                        }
                      >
                        Clear avatar
                      </ModChip>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Team announcements
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--v2-fg-subtle)]">
                Remove abusive posts
              </p>
            </div>
          </CardHeader>
          <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0 pt-0">
            {!loaded ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="admin-skeleton h-16" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <AdminEmpty>No announcements yet</AdminEmpty>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="admin-row space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                        {a.title}
                      </p>
                      <p className="text-[11px] text-[var(--v2-fg-subtle)]">
                        @{a.authorUsername} ·{" "}
                        <Link
                          href={`/teams/${a.teamSlug}`}
                          className="text-[var(--admin-teal)] no-underline hover:underline"
                        >
                          {a.teamName}
                        </Link>
                        {" · "}
                        {relativeTime(a.createdAt)}
                      </p>
                    </div>
                    <ModChip
                      pending={pending}
                      danger
                      onClick={() => void removeAnnouncement(a)}
                    >
                      Remove
                    </ModChip>
                  </div>
                  <p className="line-clamp-3 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                    {a.body}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
      {dialog}
    </AdminShell>
  );
}

function ModChip({
  children,
  onClick,
  pending,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  pending?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={
        danger
          ? "min-h-8 rounded-full border border-[var(--admin-rose)]/30 px-2.5 text-[11px] font-semibold text-[var(--admin-rose)] hover:bg-[var(--admin-rose-soft)] disabled:opacity-50"
          : "min-h-8 rounded-full border border-[var(--v2-border)] px-2.5 text-[11px] font-semibold text-[var(--v2-fg-muted)] hover:border-[var(--admin-teal)]/40 hover:text-[var(--v2-fg)] disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}
