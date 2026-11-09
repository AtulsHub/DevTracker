"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { EmptyState } from "@/v2/components/EmptyState";
import { PageHeader } from "@/v2/components/PageHeader";
import { PlatformBadge } from "@/v2/components/Badge";
import {
  SubmissionList,
  type SubmissionListItem,
} from "@/v2/components/dashboard/SubmissionList";
import { LINKABLE_PLATFORMS } from "@/v2/design/platforms";
import { platformColor, platformLabel } from "@/v2/lib/platforms";
import { cn } from "@/v2/lib/cn";

type StatusFilter = "all" | "accepted" | "failed";

export function SubmissionsScreen({
  submissions,
}: {
  submissions: SubmissionListItem[];
}) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [platform, setPlatform] = useState<string | "all">("all");

  const platformsInFeed = useMemo(() => {
    const ids = new Set(submissions.map((s) => s.platform));
    return LINKABLE_PLATFORMS.filter((id) => ids.has(id));
  }, [submissions]);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (platform !== "all" && s.platform !== platform) return false;
      const ok = !s.verdict || s.verdict === "OK";
      if (status === "accepted") return ok;
      if (status === "failed") return !ok;
      return true;
    });
  }, [submissions, status, platform]);

  const counts = useMemo(() => {
    let accepted = 0;
    let failed = 0;
    for (const s of submissions) {
      if (!s.verdict || s.verdict === "OK") accepted += 1;
      else failed += 1;
    }
    return { accepted, failed, total: submissions.length };
  }, [submissions]);

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg-muted)] no-underline hover:text-[var(--v2-fg)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to Overview
          </Link>
          <PageHeader title="All submissions" className="mb-0" />
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all" as const, label: `All (${counts.total})` },
              { id: "accepted" as const, label: `Accepted (${counts.accepted})` },
              { id: "failed" as const, label: `Failed (${counts.failed})` },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={status === opt.id}
              onClick={() => setStatus(opt.id)}
              className={cn(
                "min-h-8 rounded-[var(--v2-radius-md)] border px-2.5 text-[var(--v2-text-xs)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-primary)]",
                status === opt.id
                  ? "border-transparent bg-[var(--v2-primary)] text-[var(--v2-on-primary)]"
                  : "border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)]",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {platformsInFeed.length > 1 ? (
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Platform filter"
          >
            <button
              type="button"
              aria-pressed={platform === "all"}
              onClick={() => setPlatform("all")}
              className={cn(
                "min-h-8 rounded-[var(--v2-radius-md)] border px-2.5 text-[var(--v2-text-xs)] font-medium",
                platform === "all"
                  ? "border-transparent bg-[var(--v2-primary)] text-[var(--v2-on-primary)]"
                  : "border-[var(--v2-border)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)]",
              )}
            >
              All platforms
            </button>
            {platformsInFeed.map((id) => {
              const on = platform === id;
              const color = platformColor(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPlatform(id)}
                  className={cn(
                    "inline-flex min-h-8 items-center gap-1.5 rounded-[var(--v2-radius-md)] border px-2.5 text-[var(--v2-text-xs)] font-medium",
                    on
                      ? "border-transparent text-white"
                      : "border-[var(--v2-border)] text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)]",
                  )}
                  style={on ? { background: color } : undefined}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      background: on ? "rgba(255,255,255,0.95)" : color,
                    }}
                    aria-hidden
                  />
                  {platformLabel(id)}
                </button>
              );
            })}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <div>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                History
              </h2>
              <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                {filtered.length} shown
                {platformsInFeed.length === 1 ? (
                  <>
                    {" · "}
                    <PlatformBadge platform={platformsInFeed[0]!} compact />
                  </>
                ) : null}
              </p>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {submissions.length === 0 ? (
              <EmptyState
                title="No submissions synced yet"
                className="py-10"
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="Nothing matches these filters"
                className="py-10"
              />
            ) : (
              <SubmissionList items={filtered} showVerdict />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
