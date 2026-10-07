"use client";

/**
 * src/app/(app)/contests/page.tsx
 * Contest list page with filters, countdown timers, and platform tabs.
 */
import { useState, useEffect, useMemo } from "react";
import { format, formatDistanceToNow, isBefore, addDays } from "date-fns";
import { ContestCard } from "@/components/features/ContestCard";

interface Contest {
  id: string;
  platform: string;
  externalId: string;
  name: string;
  url?: string;
  startsAt: string;
  durationSeconds?: number;
  type?: string;
  phase: string;
}

interface ContestPageProps {
  initialContests?: Contest[];
}

const PLATFORM_COLORS: Record<string, string> = {
  codeforces: "#1976D2",
  leetcode: "#FFA116",
  atcoder: "#006FCC",
  codechef: "#5B4638",
  hackerrank: "#2EC866",
  hackerearth: "#323754",
  cses: "#000000",
  kattis: "#E63946",
};

const PLATFORM_ICONS: Record<string, string> = {
  codeforces: "📊",
  leetcode: "🔥",
  atcoder: "🇯🇵",
  codechef: "👨‍🍳",
  hackerrank: "🏆",
  hackerearth: "🌍",
  cses: "📚",
  kattis: "🐱",
};

const PHASE_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  BEFORE: { label: "Upcoming", color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.15)" },
  CODING: { label: "Live", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.15)" },
  PENDING_SYSTEM_TEST: { label: "System Test", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.15)" },
  SYSTEM_TEST: { label: "System Test", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.15)" },
  FINISHED: { label: "Finished", color: "var(--text-tertiary)", bgColor: "var(--bg-elevated)" },
};

export default function ContestsPage({ initialContests = [] }: ContestPageProps) {
  const [contests, setContests] = useState<Contest[]>(initialContests);
  const [isLoading, setIsLoading] = useState(!initialContests.length);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [now, setNow] = useState(new Date());

  // Update current time every minute for countdown timers
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch contests on mount
  useEffect(() => {
    if (initialContests.length > 0) return;

    async function fetchContests() {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (selectedPlatform !== "all") params.set("platform", selectedPlatform);
        if (selectedPhase !== "all") params.set("phase", selectedPhase);
        params.set("upcoming", "true");
        params.set("days", timeRange.replace("d", ""));

        const res = await fetch(`/api/contests?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch contests");

        setContests(data.contests || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load contests");
      } finally {
        setIsLoading(false);
      }
    }

    fetchContests();
  }, [selectedPlatform, selectedPhase, timeRange]);

  // Filter contests client-side for instant feedback
  const filteredContests = useMemo(() => {
    return contests.filter((c) => {
      if (selectedPlatform !== "all" && c.platform !== selectedPlatform) return false;
      if (selectedPhase !== "all" && c.phase !== selectedPhase) return false;
      return true;
    });
  }, [contests, selectedPlatform, selectedPhase]);

  // Group contests by platform
  const groupedContests = useMemo(() => {
    const groups: Record<string, Contest[]> = {};
    for (const c of filteredContests) {
      if (!groups[c.platform]) groups[c.platform] = [];
      groups[c.platform].push(c);
    }
    return groups;
  }, [filteredContests]);

  // Get unique platforms from data
  const availablePlatforms = useMemo(() => {
    const platforms = new Set(contests.map((c) => c.platform));
    return Array.from(platforms).sort();
  }, [contests]);

  const handleExportICS = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPlatform !== "all") params.set("platform", selectedPlatform);
      if (selectedPhase !== "all") params.set("phase", selectedPhase);
      params.set("upcoming", "true");
      params.set("days", timeRange.replace("d", ""));

      const res = await fetch(`/api/contests/ics?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to generate calendar");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devtrack-contests-${new Date().toISOString().split("T")[0]}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ICS export failed:", err);
      alert("Failed to export calendar");
    }
  };

  const getPhaseInfo = (phase: string) => PHASE_LABELS[phase] || PHASE_LABELS.BEFORE;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <p className="terminal-header" style={{ marginBottom: "0.25rem" }}>
              ~/contests $
            </p>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Contest Calendar</h1>
          </div>
          <button
            onClick={handleExportICS}
            disabled={isLoading || filteredContests.length === 0}
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              cursor: filteredContests.length === 0 ? "not-allowed" : "pointer",
              fontSize: "0.8125rem",
              fontWeight: 500,
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              opacity: filteredContests.length === 0 ? 0.5 : 1,
            }}
          >
            📅 Export .ics
          </button>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Upcoming and live contests across all platforms
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "0.5rem" }}>Platform:</label>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: "0.8125rem",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
            }}
          >
            <option value="all">All Platforms</option>
            {availablePlatforms.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_ICONS[p] || "📝"} {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "0.5rem" }}>Status:</label>
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: "0.8125rem",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="BEFORE">Upcoming</option>
            <option value="CODING">Live</option>
            <option value="FINISHED">Finished</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "0.5rem" }}>Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: "0.8125rem",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
            }}
          >
            <option value="7d">Next 7 Days</option>
            <option value="30d">Next 30 Days</option>
            <option value="90d">Next 90 Days</option>
          </select>
        </div>

        <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
          {filteredContests.length} contest{filteredContests.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Contest List */}
      {isLoading ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 1rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "var(--text-tertiary)" }}>Loading contests...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "1rem", padding: "8px 16px", borderRadius: "var(--radius-md)", backgroundColor: "var(--accent)", color: "var(--text-inverse)", border: "none", cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>🏁</div>
          <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>No contests found</p>
          <p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
            Try adjusting your filters or check back later.
          </p>
        </div>
      ) : (
        <>
          {/* Upcoming contests grouped by platform */}
          {Object.entries(groupedContests).map(([platform, platformContests]) => (
            <div key={platform} style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    backgroundColor: `${PLATFORM_COLORS[platform] || "var(--accent)"}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                  }}
                >
                  {PLATFORM_ICONS[platform] || "📝"}
                </div>
                <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </h2>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "var(--accent-bg)",
                    color: "var(--accent)",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {platformContests.length}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {platformContests
                  .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
                  .map((contest) => (
                    <ContestCard
                      key={contest.id}
                      contest={contest}
                      now={now}
                      platformColor={PLATFORM_COLORS[platform] || "var(--accent)"}
                      platformIcon={PLATFORM_ICONS[platform] || "📝"}
                    />
                  ))}
              </div>
            </div>
          ))}

          {/* All contests flat list (alternative view) */}
          <details style={{ marginTop: "2rem" }}>
            <summary style={{ cursor: "pointer", padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface)", fontWeight: 500 }}>
              View all contests as flat list ({filteredContests.length})
            </summary>
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {filteredContests
                .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
                .map((contest) => (
                  <ContestCard
                    key={contest.id}
                    contest={contest}
                    now={now}
                    platformColor={PLATFORM_COLORS[contest.platform] || "var(--accent)"}
                    platformIcon={PLATFORM_ICONS[contest.platform] || "📝"}
                    compact
                  />
                ))}
            </div>
          </details>
        </>
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