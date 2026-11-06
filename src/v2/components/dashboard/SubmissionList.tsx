"use client";

import { PlatformBadge } from "@/v2/components/Badge";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/v2/lib/cn";

export type SubmissionListItem = {
  id: string;
  platform: string;
  title: string;
  url: string | null;
  rating: number | null;
  verdict?: string | null;
  submittedAt: Date | string;
};

export function verdictLabel(verdict: string | null | undefined) {
  if (!verdict || verdict === "OK") return { short: "AC", ok: true };
  const map: Record<string, string> = {
    WRONG_ANSWER: "WA",
    TIME_LIMIT_EXCEEDED: "TLE",
    MEMORY_LIMIT_EXCEEDED: "MLE",
    RUNTIME_ERROR: "RE",
    COMPILATION_ERROR: "CE",
    PARTIAL: "Partial",
    OTHER: "Fail",
  };
  return { short: map[verdict] ?? verdict, ok: false };
}

export function SubmissionList({
  items,
  showVerdict = true,
}: {
  items: SubmissionListItem[];
  showVerdict?: boolean;
}) {
  return (
    <ul className="divide-y divide-[var(--v2-border-subtle)]">
      {items.map((s) => {
        const v = verdictLabel(s.verdict);
        return (
          <li
            key={s.id}
            className="flex items-start justify-between gap-3 py-3 first:pt-1"
          >
            <div className="min-w-0">
              <p className="truncate text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
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
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <PlatformBadge platform={s.platform} />
                {showVerdict ? (
                  <span
                    className={cn(
                      "rounded-[var(--v2-radius-md)] px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                      v.ok
                        ? "bg-[var(--v2-success)]/10 text-[var(--v2-success)]"
                        : "bg-[var(--v2-danger)]/10 text-[var(--v2-danger)]",
                    )}
                  >
                    {v.short}
                  </span>
                ) : null}
                {s.rating != null ? (
                  <span className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                    {s.rating}
                  </span>
                ) : null}
              </div>
            </div>
            <time className="shrink-0 font-mono text-[11px] text-[var(--v2-fg-subtle)]">
              {formatRelativeTime(s.submittedAt)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
