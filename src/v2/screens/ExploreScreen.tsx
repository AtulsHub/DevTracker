"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/v2/components/Card";
import { Input } from "@/v2/components/Input";
import { EmptyState } from "@/v2/components/EmptyState";
import { PlatformBadge } from "@/v2/components/Badge";

export type ExploreUser = {
  username: string;
  displayName: string | null;
  avatarUrl?: string | null;
  headline?: string | null;
  profileVisibility: string;
  platforms: string[];
  totalSolved?: number;
};

export function ExploreScreen({ users }: { users: ExploreUser[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(needle) ||
        (u.displayName ?? "").toLowerCase().includes(needle),
    );
  }, [q, users]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      <header className="public-page-hero rounded-none sm:rounded-[var(--v2-radius-xl)] sm:border sm:border-[var(--v2-border)]">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--v2-primary)]">
          Explore
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-bold tracking-tight text-[var(--v2-fg)]">
          Find public coders
        </h1>
        <p className="mt-2 max-w-lg text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
          Only public profiles appear here. Private accounts stay locked — we
          never fetch their stats.
        </p>
        <div className="mt-5 max-w-md">
          <Input
            label="Search"
            placeholder="Username or display name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No public profiles found"
            description="Try another search, or make your profile public in Settings."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <Link
              key={u.username}
              href={`/u/${u.username}`}
              className="group no-underline"
            >
              <Card className="h-full transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[var(--v2-shadow-md)]">
                <CardBody>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="size-12 overflow-hidden rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)]">
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatarUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center font-[family-name:var(--font-display)] text-lg font-bold text-[var(--v2-primary)]">
                          {(u.displayName ?? u.username).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--v2-fg)] group-hover:text-[var(--v2-primary)]">
                        {u.displayName ?? u.username}
                      </p>
                      <p className="font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                        @{u.username}
                      </p>
                      {u.headline ? (
                        <p className="mt-0.5 truncate text-[11px] text-[var(--v2-fg-muted)]">
                          {u.headline}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {u.platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} />
                    ))}
                  </div>
                  {typeof u.totalSolved === "number" ? (
                    <p className="font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                      {u.totalSolved} solved
                    </p>
                  ) : null}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
