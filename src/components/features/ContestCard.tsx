"use client";

/**
 * src/components/features/ContestCard.tsx
 * Reusable contest card component with countdown timer.
 */
import { useState, useEffect } from "react";
import { format, formatDistanceToNow, isBefore } from "date-fns";

interface ContestCardProps {
  contest: {
    id: string;
    platform: string;
    externalId: string;
    name: string;
    url?: string;
    startsAt: string;
    durationSeconds?: number;
    type?: string;
    phase: string;
  };
  now: Date;
  platformColor: string;
  platformIcon: string;
  compact?: boolean;
}

const PHASE_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  BEFORE: { label: "Upcoming", color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.15)" },
  CODING: { label: "Live", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.15)" },
  PENDING_SYSTEM_TEST: { label: "System Test", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.15)" },
  SYSTEM_TEST: { label: "System Test", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.15)" },
  FINISHED: { label: "Finished", color: "var(--text-tertiary)", bgColor: "var(--bg-elevated)" },
};

export function ContestCard({ contest, now, platformColor, platformIcon, compact = false }: ContestCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  const startsAt = new Date(contest.startsAt);
  const endsAt = contest.durationSeconds
    ? new Date(startsAt.getTime() + contest.durationSeconds * 1000)
    : null;
  const phase = contest.phase;
  const phaseInfo = PHASE_LABELS[phase] || PHASE_LABELS.BEFORE;

  // Update countdown every minute
  useEffect(() => {
    const updateTimeLeft = () => {
      const currentNow = new Date();

      if (phase === "BEFORE") {
        if (isBefore(currentNow, startsAt)) {
          setTimeLeft(formatDistanceToNow(startsAt, { addSuffix: true }));
        } else {
          setTimeLeft("Starting now...");
        }
      } else if (phase === "CODING" && endsAt) {
        if (isBefore(currentNow, endsAt)) {
          setTimeLeft(`${formatDistanceToNow(endsAt, { addSuffix: true })} left`);
        } else {
          setTimeLeft("Ending soon...");
        }
      } else {
        setTimeLeft("");
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [phase, startsAt, endsAt, now]);

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "0.875rem 1rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          backgroundColor: "var(--bg-surface)",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "6px",
            backgroundColor: `${platformColor}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            flexShrink: 0,
          }}
        >
          {platformIcon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>
              {contest.name}
            </span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                backgroundColor: phaseInfo.bgColor,
                color: phaseInfo.color,
                fontSize: "0.625rem",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
              }}
            >
              {phaseInfo.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {format(startsAt, "MMM d, HH:mm")}
            </span>
            {timeLeft && (
              <span style={{ color: phase === "BEFORE" ? "#22c55e" : phase === "CODING" ? "#ef4444" : "var(--text-tertiary)" }}>
                {timeLeft}
              </span>
            )}
            {contest.durationSeconds && (
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {Math.round(contest.durationSeconds / 60)} min
              </span>
            )}
          </div>
        </div>

        {contest.url && (
          <a
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-base)",
              color: "var(--text-secondary)",
              fontSize: "0.75rem",
              fontWeight: 500,
              textDecoration: "none",
              fontFamily: "var(--font-mono)",
              whiteSpace: "nowrap",
            }}
          >
            View
          </a>
        )}
      </div>
    );
  }

  // Full card layout
  return (
    <div
      style={{
        padding: "1.25rem",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        backgroundColor: "var(--bg-surface)",
        borderLeft: `4px solid ${platformColor}`,
        transition: "all 0.2s ease",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "8px",
              backgroundColor: `${platformColor}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
            }}
          >
            {platformIcon}
          </div>
          <div>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                backgroundColor: phaseInfo.bgColor,
                color: phaseInfo.color,
                fontSize: "0.625rem",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
              }}
            >
              {phaseInfo.label}
            </span>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {contest.platform.charAt(0).toUpperCase() + contest.platform.slice(1)}
            </p>
          </div>
        </div>

        {contest.type && (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              fontFamily: "var(--font-mono)",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            {contest.type}
          </span>
        )}
      </div>

      {/* Contest Name */}
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)" }}>
        {contest.name}
      </h3>

      {/* Time Info */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>🕐</span>
          <div style={{ fontFamily: "var(--font-mono)" }}>
            <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}>
              {format(startsAt, "MMM d, yyyy HH:mm")}
            </p>
            <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>Starts</p>
          </div>
        </div>

        {endsAt && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>🏁</span>
            <div style={{ fontFamily: "var(--font-mono)" }}>
              <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}>
                {format(endsAt, "MMM d, yyyy HH:mm")}
              </p>
              <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>Ends</p>
            </div>
          </div>
        )}

        {contest.durationSeconds && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>⏱️</span>
            <div style={{ fontFamily: "var(--font-mono)" }}>
              <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}>
                {Math.round(contest.durationSeconds / 60)} min
              </p>
              <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>Duration</p>
            </div>
          </div>
        )}

        {phase === "BEFORE" && timeLeft && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(34, 197, 94, 0.15)",
              color: "#22c55e",
              fontSize: "0.75rem",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
            }}
          >
            <span style={{ animation: "pulse 2s infinite" }}>⏰</span>
            <span>{timeLeft}</span>
          </div>
        )}

        {phase === "CODING" && timeLeft && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              fontSize: "0.75rem",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
            }}
          >
            <span style={{ animation: "pulse 1s infinite" }}>🔴</span>
            <span>Live - {timeLeft}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {contest.url && (
        <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
          <a
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-base)",
              color: "var(--text-primary)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "var(--font-mono)",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s ease",
            }}
          >
            🌐 View on {contest.platform.charAt(0).toUpperCase() + contest.platform.slice(1)}
          </a>
          <button
            onClick={() => {
              const text = `${contest.name}\n${contest.url}\nStarts: ${format(startsAt, "MMM d, yyyy HH:mm")}`;
              navigator.clipboard.writeText(text);
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-base)",
              color: "var(--text-secondary)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            📋 Copy
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}