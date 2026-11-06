"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search, Target, Users } from "lucide-react";
import { Card, CardBody } from "@/v2/components/Card";
import { EmptyState } from "@/v2/components/EmptyState";
import { PlatformBadge } from "@/v2/components/Badge";
import { PageHeader } from "@/v2/components/PageHeader";
import { cn } from "@/v2/lib/cn";

export type ExploreUser = {
  username: string;
  displayName: string | null;
  avatarUrl?: string | null;
  headline?: string | null;
  location?: string | null;
  college?: string | null;
  skills?: string | null;
  profileVisibility: string;
  platforms: string[];
  totalSolved?: number;
  maxRating?: number | null;
};

type SortMode = "solved" | "name" | "rating";
type FilterMode = "all" | "active";

export function ExploreScreen({ users }: { users: ExploreUser[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("solved");
  const [filter, setFilter] = useState<FilterMode>("all");

  const stats = useMemo(() => {
    const totalSolved = users.reduce((s, u) => s + (u.totalSolved ?? 0), 0);
    const withPlatforms = users.filter((u) => u.platforms.length > 0).length;
    const withSkills = users.filter((u) => (u.skills ?? "").trim().length > 0)
      .length;
    return { totalSolved, withPlatforms, withSkills, count: users.length };
  }, [users]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = users.filter((u) => {
      if (filter === "active" && !(u.totalSolved && u.totalSolved > 0)) {
        return false;
      }
      if (!needle) return true;
      const skills = (u.skills ?? "").toLowerCase();
      return (
        u.username.toLowerCase().includes(needle) ||
        (u.displayName ?? "").toLowerCase().includes(needle) ||
        (u.headline ?? "").toLowerCase().includes(needle) ||
        (u.location ?? "").toLowerCase().includes(needle) ||
        (u.college ?? "").toLowerCase().includes(needle) ||
        skills.includes(needle) ||
        u.platforms.some((p) => p.toLowerCase().includes(needle))
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "name") {
        return (a.displayName ?? a.username).localeCompare(
          b.displayName ?? b.username,
        );
      }
      if (sort === "rating") {
        return (b.maxRating ?? 0) - (a.maxRating ?? 0);
      }
      return (b.totalSolved ?? 0) - (a.totalSolved ?? 0);
    });
    return list;
  }, [q, users, sort, filter]);

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader
        title="Explore"
        description="Discover public builders — coding stats, skills, and platforms."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Public profiles" value={stats.count} icon={Users} />
        <MiniStat
          label="Total solves"
          value={stats.totalSolved.toLocaleString()}
          icon={Target}
        />
        <MiniStat label="With platforms" value={stats.withPlatforms} />
        <MiniStat label="With skills" value={stats.withSkills} />
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--v2-fg-subtle)]"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, skill, location, platform…"
            className="min-h-10 w-full rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] py-2 pl-10 pr-3 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["active", "Has solves"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "min-h-9 rounded-[var(--v2-radius-md)] px-3 text-[var(--v2-text-xs)] font-medium transition-colors",
                filter === id
                  ? "bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
                  : "bg-[var(--v2-bg-muted)] text-[var(--v2-fg-muted)] hover:text-[var(--v2-fg)]",
              )}
            >
              {label}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="min-h-9 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-2 text-[var(--v2-text-xs)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
            aria-label="Sort profiles"
          >
            <option value="solved">Sort: solves</option>
            <option value="rating">Sort: rating</option>
            <option value="name">Sort: name</option>
          </select>
        </div>
      </div>

      <p className="mb-3 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
        Showing {filtered.length} of {users.length} public profiles
      </p>

      {filtered.length === 0 ? (
        <Card className="shadow-[var(--v2-shadow-sm)]">
          <EmptyState
            title="No public profiles found"
            description="Try another search, or make your profile public in Settings."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u) => {
            const skills = (u.skills ?? "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 4);
            return (
              <Link
                key={u.username}
                href={`/u/${u.username}`}
                className="group no-underline"
              >
                <Card className="h-full overflow-hidden shadow-[var(--v2-shadow-sm)] transition-all duration-[var(--v2-duration)] group-hover:-translate-y-0.5 group-hover:border-[var(--v2-border-strong)] group-hover:shadow-[var(--v2-shadow-md)]">
                  <div
                    className="h-16 border-b border-[var(--v2-border)]"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in srgb, var(--v2-primary) 22%, transparent), color-mix(in srgb, var(--v2-accent) 14%, transparent) 55%, var(--v2-bg-muted))",
                    }}
                    aria-hidden
                  />
                  <CardBody className="relative pt-0">
                    <div className="-mt-8 mb-3">
                      <div className="size-14 overflow-hidden rounded-[1rem] border-4 border-[var(--v2-bg-elevated)] bg-[var(--v2-primary-muted)] shadow-[var(--v2-shadow-sm)]">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-base font-semibold text-[var(--v2-primary)]">
                            {(u.displayName ?? u.username)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="truncate text-[var(--v2-text-base)] font-semibold text-[var(--v2-fg)]">
                      {u.displayName ?? u.username}
                    </p>
                    <p className="font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                      @{u.username}
                    </p>
                    {u.headline ? (
                      <p className="mt-1.5 line-clamp-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                        {u.headline}
                      </p>
                    ) : null}

                    {(u.location || u.college) && (
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--v2-fg-subtle)]">
                        <MapPin className="size-3 shrink-0" aria-hidden />
                        <span className="truncate">
                          {[u.location, u.college].filter(Boolean).join(" · ")}
                        </span>
                      </p>
                    )}

                    {u.platforms.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {u.platforms.slice(0, 4).map((p) => (
                          <PlatformBadge key={p} platform={p} />
                        ))}
                        {u.platforms.length > 4 ? (
                          <span className="text-[10px] text-[var(--v2-fg-subtle)]">
                            +{u.platforms.length - 4}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {skills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-[var(--v2-radius-full)] bg-[var(--v2-bg-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--v2-fg-muted)]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between border-t border-[var(--v2-border-subtle)] pt-3">
                      <div>
                        <p className="font-mono text-[var(--v2-text-sm)] font-semibold tabular-nums text-[var(--v2-fg)]">
                          {(u.totalSolved ?? 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                          Solved
                        </p>
                      </div>
                      {u.maxRating ? (
                        <div className="text-right">
                          <p className="font-mono text-[var(--v2-text-sm)] font-semibold tabular-nums text-[var(--v2-fg)]">
                            {u.maxRating}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                            Rating
                          </p>
                        </div>
                      ) : (
                        <span className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] opacity-0 transition-opacity group-hover:opacity-100">
                          View profile →
                        </span>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon?: typeof Users;
}) {
  return (
    <div className="rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-3.5 shadow-[var(--v2-shadow-sm)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-[var(--v2-fg-muted)]">
          {label}
        </p>
        {Icon ? (
          <span className="text-[var(--v2-primary)]">
            <Icon className="size-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--v2-fg)]">
        {value}
      </p>
    </div>
  );
}
