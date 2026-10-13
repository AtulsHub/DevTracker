"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { EmptyState } from "@/v2/components/EmptyState";
import { PlatformBadge } from "@/v2/components/Badge";
import { LINKABLE_PLATFORMS, PLATFORMS } from "@/v2/design/platforms";
import { v2Api } from "@/v2/lib/api";
import { formatRelativeTime } from "@/lib/utils";

export type PlatformStat = {
  id: string;
  platform: string;
  handle: string;
  currentRating: number | null;
  maxRating: number | null;
  rank: string | null;
  solvedCount: number;
  syncStatus: string;
  lastSyncedAt: Date | string | null;
  syncError: string | null;
};

export type RecentSolve = {
  id: string;
  platform: string;
  title: string;
  url: string | null;
  rating: number | null;
  submittedAt: Date | string;
};

export function DashboardScreen({
  totalSolved,
  streak,
  todaySolved,
  platforms,
  recent,
  heatmap,
}: {
  totalSolved: number;
  streak: number;
  todaySolved: number;
  platforms: PlatformStat[];
  recent: RecentSolve[];
  heatmap: Array<{ date: string; count: number }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [platform, setPlatform] = useState(LINKABLE_PLATFORMS[0]!);
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function syncAll() {
    setSyncMsg(null);
    try {
      const r = await v2Api.syncAll();
      setSyncMsg(`Synced ${r.synced} platform(s)`);
      startTransition(() => router.refresh());
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "Sync failed");
    }
  }

  async function link() {
    setError(null);
    try {
      await v2Api.linkPlatform(platform, handle.trim());
      setSheetOpen(false);
      setHandle("");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Link failed");
    }
  }

  const heatMax = Math.max(...heatmap.map((d) => d.count), 1);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[var(--v2-text-2xl)] font-bold">Dashboard</h1>
          <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Live stats from your linked platforms
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" loading={pending} onClick={() => void syncAll()}>
            Sync now
          </Button>
          <Button onClick={() => setSheetOpen(true)}>Link platform</Button>
        </div>
      </div>
      {syncMsg ? (
        <p className="mb-3 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
          {syncMsg}
        </p>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total solved" value={totalSolved} />
        <Kpi label="Today" value={todaySolved} />
        <Kpi label="Streak" value={`${streak}d`} />
        <Kpi label="Linked" value={platforms.length} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-[var(--v2-text-sm)] font-semibold">Activity heatmap</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto pt-0">
          <div className="flex flex-wrap gap-0.5" aria-label="Activity heatmap">
            {heatmap
              .filter((_, i) => i % 2 === 0)
              .map((d) => {
                const level =
                  d.count === 0
                    ? 0
                    : Math.min(4, Math.ceil((d.count / heatMax) * 4));
                return (
                  <span
                    key={d.date}
                    title={`${d.date}: ${d.count}`}
                    className="size-2.5 rounded-[2px]"
                    style={{ background: `var(--v2-heat-${level})` }}
                  />
                );
              })}
          </div>
        </CardBody>
      </Card>

      <section className="mb-6">
        <h2 className="mb-3 text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg-muted)]">
          Linked platforms
        </h2>
        {platforms.length === 0 ? (
          <Card>
            <EmptyState
              title="No platforms linked"
              description="Connect Codeforces, LeetCode, and more to populate this dashboard."
              action={
                <Button onClick={() => setSheetOpen(true)}>Link a platform</Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {platforms.map((p) => {
              const meta = PLATFORMS[p.platform as keyof typeof PLATFORMS];
              return (
                <Card
                  key={p.id}
                  style={{
                    borderTop: `3px solid ${meta?.colorVar ?? "var(--v2-primary)"}`,
                  }}
                >
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <PlatformBadge platform={p.platform} />
                        <a
                          href={meta?.profileUrl(p.handle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                        >
                          @{p.handle}
                        </a>
                        {p.rank ? (
                          <p className="text-[var(--v2-text-xs)] capitalize text-[var(--v2-fg-subtle)]">
                            {p.rank}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[var(--v2-text-3xl)] font-bold text-[var(--v2-primary)]">
                          {p.solvedCount}
                        </p>
                        <p className="text-[10px] uppercase text-[var(--v2-fg-subtle)]">
                          Solved
                        </p>
                      </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--v2-border)] pt-3 text-[var(--v2-text-sm)]">
                      <div>
                        <dt className="text-[10px] uppercase text-[var(--v2-fg-subtle)]">
                          Rating
                        </dt>
                        <dd className="font-mono font-semibold">
                          {p.currentRating ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase text-[var(--v2-fg-subtle)]">
                          Synced
                        </dt>
                        <dd className="font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                          {p.lastSyncedAt
                            ? formatRelativeTime(p.lastSyncedAt)
                            : "Never"}
                        </dd>
                      </div>
                    </dl>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-[var(--v2-text-sm)] font-semibold">Recent solves</h2>
          <Link
            href="/explore"
            className="font-mono text-[var(--v2-text-xs)] text-[var(--v2-primary)] no-underline"
          >
            Explore
          </Link>
        </CardHeader>
        <CardBody className="pt-0">
          {recent.length === 0 ? (
            <EmptyState title="No solves synced yet" />
          ) : (
            <ul className="divide-y divide-[var(--v2-border)]">
              {recent.map((s) => (
                <li key={s.id} className="flex justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[var(--v2-text-sm)] font-medium">
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                        >
                          {s.title}
                        </a>
                      ) : (
                        s.title
                      )}
                    </p>
                    <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                      {s.platform}
                      {s.rating != null ? ` · ${s.rating}` : ""}
                    </p>
                  </div>
                  <time className="shrink-0 font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                    {formatRelativeTime(s.submittedAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Link a platform"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {LINKABLE_PLATFORMS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPlatform(id)}
              className={`min-h-9 rounded-[var(--v2-radius-full)] border px-3 font-mono text-[11px] ${
                platform === id
                  ? "border-transparent bg-[var(--v2-primary)] text-[var(--v2-fg-inverse)]"
                  : "border-[var(--v2-border)]"
              }`}
            >
              {PLATFORMS[id].short}
            </button>
          ))}
        </div>
        <Input
          label={`${PLATFORMS[platform].label} handle`}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="username"
          error={error ?? undefined}
        />
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" onClick={() => void link()} loading={pending}>
            Link & sync
          </Button>
          <Button variant="ghost" onClick={() => setSheetOpen(false)}>
            Cancel
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardBody>
        <p className="text-[10px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
          {label}
        </p>
        <p className="mt-1 font-mono text-[var(--v2-text-2xl)] font-bold text-[var(--v2-primary)]">
          {value}
        </p>
      </CardBody>
    </Card>
  );
}
