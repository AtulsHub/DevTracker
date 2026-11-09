"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Filter,
  MapPin,
  Search,
  Target,
  Users,
  X,
} from "lucide-react";
import { Card, CardBody } from "@/v2/components/Card";
import { EmptyState } from "@/v2/components/EmptyState";
import { PlatformBadge } from "@/v2/components/Badge";
import { PageHeader } from "@/v2/components/PageHeader";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { LINKABLE_PLATFORMS, PLATFORMS } from "@/v2/design/platforms";
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

type SortMode = "solved" | "rating" | "name";
type QuickFilter = "all" | "linked" | "rated" | "active";

export function ExploreScreen({ users }: { users: ExploreUser[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("solved");
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [platform, setPlatform] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const availablePlatforms = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of users) {
      for (const p of u.platforms) {
        counts.set(p, (counts.get(p) ?? 0) + 1);
      }
    }
    return LINKABLE_PLATFORMS.filter((id) => (counts.get(id) ?? 0) > 0).map(
      (id) => ({ id, count: counts.get(id) ?? 0 }),
    );
  }, [users]);

  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of users) {
      for (const raw of (u.skills ?? "").split(",")) {
        const s = raw.trim();
        if (!s) continue;
        const key = s.toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, count]) => {
        const label =
          users
            .flatMap((u) => (u.skills ?? "").split(","))
            .map((s) => s.trim())
            .find((s) => s.toLowerCase() === key) ?? key;
        return { label, count };
      });
  }, [users]);

  const [skill, setSkill] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalSolved = users.reduce((s, u) => s + (u.totalSolved ?? 0), 0);
    const withPlatforms = users.filter((u) => u.platforms.length > 0).length;
    const rated = users.filter((u) => (u.maxRating ?? 0) > 0).length;
    return { totalSolved, withPlatforms, rated, count: users.length };
  }, [users]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = users.filter((u) => {
      if (quick === "linked" && u.platforms.length === 0) return false;
      if (quick === "rated" && !(u.maxRating && u.maxRating > 0)) return false;
      if (quick === "active" && !(u.totalSolved && u.totalSolved > 0)) {
        return false;
      }
      if (platform && !u.platforms.includes(platform)) return false;
      if (skill) {
        const skills = (u.skills ?? "").toLowerCase();
        if (!skills.split(",").some((s) => s.trim() === skill.toLowerCase())) {
          return false;
        }
      }
      if (!needle) return true;
      return (
        u.username.toLowerCase().includes(needle) ||
        (u.displayName ?? "").toLowerCase().includes(needle) ||
        (u.headline ?? "").toLowerCase().includes(needle) ||
        (u.location ?? "").toLowerCase().includes(needle) ||
        (u.college ?? "").toLowerCase().includes(needle) ||
        (u.skills ?? "").toLowerCase().includes(needle) ||
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
  }, [q, users, sort, quick, platform, skill]);

  const activeFilters =
    (quick !== "all" ? 1 : 0) + (platform ? 1 : 0) + (skill ? 1 : 0);

  function clearFilters() {
    setQuick("all");
    setPlatform(null);
    setSkill(null);
  }

  const activePills = useMemo(() => {
    const pills: Array<{ key: string; label: string; clear: () => void }> = [];
    if (quick !== "all") {
      const labels: Record<Exclude<QuickFilter, "all">, string> = {
        linked: "Has platforms",
        rated: "Has rating",
        active: "Has solves",
      };
      pills.push({
        key: `quick-${quick}`,
        label: labels[quick],
        clear: () => setQuick("all"),
      });
    }
    if (platform) {
      pills.push({
        key: `p-${platform}`,
        label: PLATFORMS[platform as keyof typeof PLATFORMS]?.label ?? platform,
        clear: () => setPlatform(null),
      });
    }
    if (skill) {
      pills.push({
        key: `s-${skill}`,
        label: skill,
        clear: () => setSkill(null),
      });
    }
    return pills;
  }, [quick, platform, skill]);

  const filterPanel = (
    <FilterFields
      quick={quick}
      setQuick={setQuick}
      platform={platform}
      setPlatform={setPlatform}
      skill={skill}
      setSkill={setSkill}
      availablePlatforms={availablePlatforms}
      topSkills={topSkills}
      activeFilters={activeFilters}
      onClear={clearFilters}
    />
  );

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader title="Explore" />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Public profiles" value={stats.count} icon={Users} />
        <MiniStat
          label="Total solves"
          value={stats.totalSolved.toLocaleString()}
          icon={Target}
        />
        <MiniStat label="Platforms linked" value={stats.withPlatforms} />
        <MiniStat label="With rating" value={stats.rated} />
      </div>

      {/* Search + filter trigger */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--v2-fg-subtle)]"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, college, skill…"
            className="min-h-10 w-full rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] py-2 pl-10 pr-3 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
          />
        </div>

        {/* Mobile: sheet */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Open filters"
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-[var(--v2-radius-md)] border transition-colors md:hidden",
            activeFilters > 0 || sheetOpen
              ? "border-[var(--v2-primary)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
              : "border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] text-[var(--v2-fg-muted)]",
          )}
        >
          <Filter className="size-4" aria-hidden />
          {activeFilters > 0 ? (
            <span className="v2-btn-primary absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[var(--v2-primary)] text-[9px] font-bold">
              {activeFilters}
            </span>
          ) : null}
        </button>

        {/* Desktop: collapse toggle */}
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-label={filtersOpen ? "Hide filters" : "Show filters"}
          className={cn(
            "relative hidden min-h-10 shrink-0 items-center gap-1.5 rounded-[var(--v2-radius-md)] border px-3 text-[var(--v2-text-sm)] font-medium transition-colors md:inline-flex",
            filtersOpen || activeFilters > 0
              ? "border-[var(--v2-primary)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
              : "border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] text-[var(--v2-fg-muted)] hover:text-[var(--v2-fg)]",
          )}
        >
          <Filter className="size-3.5" aria-hidden />
          Filters
          {activeFilters > 0 ? (
            <span className="v2-btn-primary flex size-4 items-center justify-center rounded-full bg-[var(--v2-primary)] text-[9px] font-bold">
              {activeFilters}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-[var(--v2-duration)]",
              filtersOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="hidden min-h-10 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-2 text-[var(--v2-text-xs)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)] sm:block"
          aria-label="Sort profiles"
        >
          <option value="solved">Most solves</option>
          <option value="rating">Highest rating</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Active filter pills (always visible when set) */}
      {activePills.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {activePills.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={p.clear}
              className="inline-flex min-h-7 items-center gap-1 rounded-[var(--v2-radius-full)] border border-[var(--v2-primary)]/30 bg-[var(--v2-primary-muted)] px-2.5 text-[11px] font-medium text-[var(--v2-primary)]"
            >
              {p.label}
              <X className="size-3" aria-hidden />
            </button>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] font-medium text-[var(--v2-fg-subtle)] hover:text-[var(--v2-fg)]"
          >
            Clear
          </button>
        </div>
      ) : null}

      {/* Desktop collapsible panel */}
      <div
        className={cn(
          "mb-3 hidden overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out md:grid",
          filtersOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-3.5 shadow-[var(--v2-shadow-sm)]">
            {filterPanel}
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Discover filters"
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)] sm:hidden">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="min-h-10 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
            >
              <option value="solved">Most solves</option>
              <option value="rating">Highest rating</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
          {filterPanel}
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="v2-btn-primary flex min-h-11 w-full items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary)] text-[var(--v2-text-sm)] font-semibold"
          >
            Show {filtered.length} profiles
          </button>
        </div>
      </BottomSheet>

      <p className="mb-3 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
        Showing {filtered.length} of {users.length} public profiles
      </p>

      {filtered.length === 0 ? (
        <Card className="shadow-[var(--v2-shadow-sm)]">
          <EmptyState
            title="No profiles match"
            action={
              activeFilters > 0 || q ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-primary)]"
                >
                  Clear filters
                </button>
              ) : undefined
            }
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

function FilterFields({
  quick,
  setQuick,
  platform,
  setPlatform,
  skill,
  setSkill,
  availablePlatforms,
  topSkills,
  activeFilters,
  onClear,
}: {
  quick: QuickFilter;
  setQuick: (v: QuickFilter) => void;
  platform: string | null;
  setPlatform: Dispatch<SetStateAction<string | null>>;
  skill: string | null;
  setSkill: Dispatch<SetStateAction<string | null>>;
  availablePlatforms: Array<{ id: string; count: number }>;
  topSkills: Array<{ label: string; count: number }>;
  activeFilters: number;
  onClear: () => void;
}) {
  return (
    <div className="space-y-4">
      {activeFilters > 0 ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-medium text-[var(--v2-primary)] hover:underline"
          >
            Reset filters
          </button>
        </div>
      ) : null}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--v2-fg-subtle)]">
          Status
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "Everyone"],
              ["linked", "Has platforms"],
              ["rated", "Has rating"],
              ["active", "Has solves"],
            ] as const
          ).map(([id, label]) => (
            <Chip
              key={id}
              active={quick === id}
              onClick={() => setQuick(id)}
              label={label}
            />
          ))}
        </div>
      </div>

      {availablePlatforms.length > 0 ? (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--v2-fg-subtle)]">
            Platform
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availablePlatforms.map(({ id, count }) => (
              <Chip
                key={id}
                active={platform === id}
                onClick={() => setPlatform((cur) => (cur === id ? null : id))}
                label={`${PLATFORMS[id as keyof typeof PLATFORMS]?.label ?? id} · ${count}`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {topSkills.length > 0 ? (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--v2-fg-subtle)]">
            Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topSkills.map(({ label, count }) => (
              <Chip
                key={label}
                active={skill?.toLowerCase() === label.toLowerCase()}
                onClick={() =>
                  setSkill((cur) =>
                    cur?.toLowerCase() === label.toLowerCase() ? null : label,
                  )
                }
                label={`${label} · ${count}`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-8 rounded-[var(--v2-radius-md)] px-2.5 text-[11px] font-medium transition-colors",
        active
          ? "bg-[var(--v2-primary)] text-[var(--v2-on-primary)]"
          : "bg-[var(--v2-bg-muted)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]",
      )}
    >
      {label}
    </button>
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
