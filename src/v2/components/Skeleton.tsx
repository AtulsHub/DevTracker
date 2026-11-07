"use client";

import { useEffect, useState } from "react";
import { cn } from "@/v2/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--v2-radius-md)] bg-[var(--v2-bg-muted)]",
        className,
      )}
      aria-hidden
    />
  );
}

/** Small centered pulse + cycling “on the way” line. */
export function OnTheWay({
  steps,
  title = "Getting things ready",
  className,
}: {
  steps: string[];
  title?: string;
  className?: string;
}) {
  const list = steps.length > 0 ? steps : ["Loading…"];
  const [i, setI] = useState(0);

  useEffect(() => {
    if (list.length < 2) return;
    const id = window.setInterval(() => {
      setI((n) => (n + 1) % list.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, [list.length]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <div className="v2-loader-orbit relative size-14" aria-hidden>
        <span className="absolute inset-0 rounded-full border border-[var(--v2-border)]" />
        <span className="v2-loader-ring absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--v2-primary)]" />
        <span className="absolute inset-[6px] flex items-center justify-center overflow-hidden rounded-full bg-[var(--v2-bg-elevated)] shadow-[var(--v2-shadow-sm)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/devtrack-symbol-transparent.png"
            alt=""
            width={32}
            height={32}
            className="size-8 object-contain"
          />
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-[13px] font-medium tracking-tight text-[var(--v2-fg)]">
          {title}
        </p>
        <p
          key={i}
          className="font-mono text-[11px] text-[var(--v2-fg-muted)]"
        >
          {list[i]}
        </p>
      </div>
    </div>
  );
}

function Shell({
  children,
  status,
  className,
}: {
  children: React.ReactNode;
  status: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Height fits the visible main pane (already below topbar). Use md: — bottom nav hides at md, not sm.
        "relative mx-auto w-full max-w-[var(--v2-content-max)] overflow-hidden px-4 py-5 sm:px-6 sm:py-7",
        "h-[calc(100dvh-var(--v2-topbar-h)-var(--v2-bottom-nav-h)-0.75rem)]",
        "md:h-[calc(100dvh-var(--v2-topbar-h)-2rem)]",
        className,
      )}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden px-4 py-5 opacity-[0.4] sm:px-6 sm:py-7">
        {children}
      </div>
      {/* Pin to geometric center of this fixed-height frame — not content height */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4">
        <div className="flex justify-center rounded-[var(--v2-radius-lg)] bg-[color-mix(in_srgb,var(--v2-bg)_72%,transparent)] px-6 py-5 backdrop-blur-[2px]">
          {status}
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <Shell
      status={
        <OnTheWay
          title="Loading page"
          steps={["Pulling layout…", "Almost there…"]}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    </Shell>
  );
}

export function DashboardSkeleton() {
  return (
    <Shell
      status={
        <OnTheWay
          title="Loading overview"
          steps={[
            "Fetching platform stats…",
            "Building your heatmap…",
            "Gathering recent solves…",
            "Checking targets…",
          ]}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    </Shell>
  );
}

export function HomeSkeleton() {
  return (
    <Shell
      status={
        <OnTheWay
          title="Loading today"
          steps={[
            "Checking today’s solves…",
            "Loading streak…",
            "Finding upcoming contests…",
          ]}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-44 w-full" />
      </div>
    </Shell>
  );
}

export function ContestsSkeleton() {
  return (
    <Shell
      status={
        <OnTheWay
          title="Loading contests"
          steps={[
            "Syncing contest calendar…",
            "Sorting by start time…",
            "Filtering platforms…",
          ]}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 shrink-0" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function ExploreSkeleton() {
  return (
    <Shell
      status={
        <OnTheWay
          title="Loading explorers"
          steps={[
            "Finding public profiles…",
            "Ranking by solves…",
            "Loading platforms…",
          ]}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function TeamsSkeleton() {
  return (
    <Shell
      status={
        <OnTheWay
          title="Loading teams"
          steps={[
            "Fetching your teams…",
            "Loading members…",
            "Checking invites…",
          ]}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function SubmissionsSkeleton() {
  return (
    <Shell
      status={
        <OnTheWay
          title="Loading submissions"
          steps={[
            "Pulling attempt history…",
            "Sorting by time…",
            "Applying filters…",
          ]}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function LandingSkeleton() {
  return (
    <div
      className="relative h-[calc(100dvh-var(--v2-topbar-h))] overflow-hidden px-5 sm:px-8"
      aria-busy="true"
      aria-label="Loading landing"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-10 mx-auto w-full max-w-[var(--v2-content-max)] space-y-4 px-5 opacity-35 sm:bottom-16 sm:px-8">
        <Skeleton className="h-16 w-[min(100%,18rem)] sm:h-24 sm:w-[min(100%,28rem)]" />
        <Skeleton className="h-6 w-[min(100%,22rem)]" />
        <Skeleton className="h-4 w-[min(100%,18rem)]" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <OnTheWay
          title="Loading DevTrack"
          steps={[
            "Warming up the landing…",
            "Fetching featured grinders…",
            "Checking the next contest…",
          ]}
        />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <Shell
      status={
        <OnTheWay
          title="Loading profile"
          steps={[
            "Opening public profile…",
            "Loading platforms…",
            "Fetching activity…",
          ]}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    </Shell>
  );
}
