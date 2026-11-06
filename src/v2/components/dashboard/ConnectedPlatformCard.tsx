"use client";

import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { PLATFORMS, type PlatformId } from "@/v2/design/platforms";
import { platformColorVar } from "@/v2/lib/platforms";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/v2/lib/cn";

export type ConnectedPlatformCardProps = {
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
  dimmed?: boolean;
};

function syncStatusLabel(status: string) {
  const s = status.toLowerCase();
  if (s.includes("error") || s.includes("fail")) return "Needs attention";
  if (s.includes("sync")) return "Syncing";
  if (s.includes("ok") || s.includes("success") || s.includes("idle")) {
    return "Connected";
  }
  return status || "Connected";
}

export function ConnectedPlatformCard({
  platform,
  handle,
  currentRating,
  maxRating,
  rank,
  solvedCount,
  syncStatus,
  lastSyncedAt,
  syncError,
  dimmed = false,
}: ConnectedPlatformCardProps) {
  const meta = PLATFORMS[platform as PlatformId];
  const color = platformColorVar(platform);
  const short = meta?.short ?? platform.slice(0, 2).toUpperCase();
  const label = meta?.label ?? platform;
  const status = syncStatusLabel(syncStatus);
  const needsAttention = status === "Needs attention" || Boolean(syncError);
  const profileUrl = meta?.profileUrl(handle);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] shadow-[var(--v2-shadow-md)] transition-[transform,box-shadow,border-color,opacity] duration-[var(--v2-duration)] hover:-translate-y-0.5 hover:border-[var(--v2-border-strong)] hover:shadow-[var(--v2-shadow-lg)]",
        dimmed && "opacity-45",
      )}
      style={
        {
          "--platform": color,
        } as CSSProperties
      }
    >
      <div
        className="h-1.5 w-full"
        style={{ background: color }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `radial-gradient(90% 70% at 100% 0%, color-mix(in srgb, ${color} 14%, transparent), transparent 58%)`,
        }}
      />
      <span
        className="pointer-events-none absolute -right-1 top-4 select-none font-mono text-[4.75rem] font-semibold leading-none tracking-tighter text-[var(--v2-fg)] opacity-[0.04]"
        aria-hidden
      >
        {short}
      </span>

      <div className="relative p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-[var(--v2-radius-md)] border px-2 py-0.5 text-[11px] font-semibold tracking-wide"
            style={{
              color,
              borderColor: `color-mix(in srgb, ${color} 35%, var(--v2-border))`,
              background: `color-mix(in srgb, ${color} 14%, var(--v2-bg-elevated))`,
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: color }}
              aria-hidden
            />
            {label}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-medium",
              needsAttention
                ? "text-[var(--v2-danger)]"
                : "text-[var(--v2-fg-muted)]",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                needsAttention
                  ? "bg-[var(--v2-danger)]"
                  : status === "Syncing"
                    ? "animate-pulse bg-[var(--v2-warning)]"
                    : "bg-[var(--v2-success)]",
              )}
              aria-hidden
            />
            {status}
          </span>
        </div>

        {profileUrl ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex max-w-full items-center gap-1.5 font-mono text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)] no-underline transition-colors hover:text-[var(--platform)]"
          >
            <span className="truncate">@{handle}</span>
            <ArrowUpRight
              className="size-3.5 shrink-0 text-[var(--v2-fg-muted)] opacity-0 transition-opacity duration-[var(--v2-duration)] group-hover:opacity-100"
              aria-hidden
            />
          </a>
        ) : (
          <p className="mt-3 truncate font-mono text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
            @{handle}
          </p>
        )}

        {rank ? (
          <p className="mt-1 text-[var(--v2-text-xs)] capitalize text-[var(--v2-fg-muted)]">
            {rank}
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Metric
            label="Solved"
            value={solvedCount.toLocaleString()}
            accent={color}
          />
          <Metric
            label="Rating"
            value={currentRating != null ? String(currentRating) : "—"}
            hint={
              maxRating != null && maxRating !== currentRating
                ? `Peak ${maxRating}`
                : undefined
            }
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--v2-border)] pt-3">
          <p className="font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
            {lastSyncedAt
              ? `Synced ${formatRelativeTime(lastSyncedAt)}`
              : "Never synced"}
          </p>
          {profileUrl ? (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-[var(--v2-primary)] no-underline underline-offset-2 hover:underline"
            >
              Open profile
            </a>
          ) : null}
        </div>

        {syncError ? (
          <p className="mt-3 text-[var(--v2-text-xs)] text-[var(--v2-danger)]">
            {syncError}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="min-w-0 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg-muted)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--v2-fg-muted)]">
        {label}
      </p>
      <p
        className="mt-1 font-mono text-[1.375rem] font-semibold tabular-nums tracking-tight text-[var(--v2-fg)]"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 font-mono text-[11px] text-[var(--v2-fg-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
