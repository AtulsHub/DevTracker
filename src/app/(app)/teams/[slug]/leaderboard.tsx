"use client";

/**
 * src/app/(app)/teams/[slug]/leaderboard.tsx
 * Team leaderboard component.
 */
import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, subWeeks } from "date-fns";
import Link from "next/link";

interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalSolved: number;
  rank: number;
}

interface LeaderboardProps {
  slug: string;
}

export function TeamLeaderboard({ slug }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekStart = subWeeks(weekStart, weekOffset);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/teams/${slug}/leaderboard?week=${weekOffset}`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        } else {
          setError("Failed to load leaderboard");
        }
      } catch (err) {
        setError("Failed to load leaderboard");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [slug, weekOffset]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 1rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "var(--text-tertiary)" }}>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Weekly Leaderboard</h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
            {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", cursor: "pointer", fontSize: "0.75rem" }}
          >
            ← Previous
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", backgroundColor: weekOffset === 0 ? "var(--bg-elevated)" : "var(--bg-surface)", color: weekOffset === 0 ? "var(--text-tertiary)" : "var(--text-primary)", cursor: weekOffset === 0 ? "not-allowed" : "pointer", fontSize: "0.75rem" }}
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
            disabled={weekOffset === 0}
            style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", backgroundColor: weekOffset === 0 ? "var(--bg-elevated)" : "var(--bg-surface)", color: weekOffset === 0 ? "var(--text-tertiary)" : "var(--text-primary)", cursor: weekOffset === 0 ? "not-allowed" : "pointer", fontSize: "0.75rem" }}
          >
            Next →
          </button>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
          <p>No activity this week</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {leaderboard.map((entry) => (
            <div
              key={entry.userId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.875rem",
                borderRadius: "var(--radius-md)",
                border: entry.rank <= 3 ? "1px solid var(--accent)" : "1px solid var(--border)",
                backgroundColor: entry.rank <= 3 ? "var(--accent-bg)" : "var(--bg-surface)",
              }}
            >
              <div
                style={{
                  width: 32,
                  minWidth: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: entry.rank === 1 ? "#F59E0B" : entry.rank === 2 ? "#9CA3AF" : entry.rank === 3 ? "#D97757" : "var(--bg-elevated)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {entry.rank}
              </div>
              <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/u/${entry.username}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {entry.displayName || entry.username}
                  </p>
                </Link>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  @{entry.username}
                </p>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)", fontSize: "1rem" }}>
                {entry.totalSolved}
              </div>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}