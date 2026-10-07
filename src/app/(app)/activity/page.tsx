"use client";

/**
 * src/app/(app)/activity/page.tsx
 * Daily Activity page with date strip and timeline.
 */
import { useState, useEffect } from "react";
import { format, addDays, subDays, isSameDay, parseISO } from "date-fns";
import { Heatmap } from "@/components/features/Heatmap";
import { StreakCounter } from "@/components/features/StreakCounter";
import { ActivityTimeline } from "@/components/features/ActivityTimeline";

interface DailyActivityData {
  date: string;
  count: number;
}

interface PlatformStat {
  platform: string;
  handle: string;
  solvedCount: number;
  currentRating: number | null;
  maxRating: number | null;
  rank: string | null;
}

interface Solve {
  id: string;
  platform: string;
  handle: string;
  problem: {
    externalId: string;
    title: string;
    url: string;
    rating?: number;
    tags: string[];
  };
  language?: string;
  submittedAt: Date | string;
  isContest: boolean;
  contestId?: string;
}

interface Contest {
  contestId?: string;
  platform: string;
  handle: string;
  submittedAt: Date | string;
  problemCount: number;
}

export default function ActivityPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]!;
  });
  const [heatmapData, setHeatmapData] = useState<DailyActivityData[]>([]);
  const [streak, setStreak] = useState(0);
  const [solves, setSolves] = useState<Solve[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timezone] = useState("UTC");

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        // In a real app, this would come from the server or an API call
        // For now, we'll simulate with mock data until the API is wired up
        const today = new Date();
        const mockHeatmapData: DailyActivityData[] = [];
        for (let i = 364; i >= 0; i--) {
          const date = addDays(today, -i);
          const dateStr = date.toISOString().split("T")[0]!;
          // Mock some random activity
          const count = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0;
          mockHeatmapData.push({ date: dateStr, count });
        }
        setHeatmapData(mockHeatmapData);
        setStreak(7); // Mock streak
        setPlatformStats([
          { platform: "codeforces", handle: "tourist", solvedCount: 1234, currentRating: 3959, maxRating: 4014, rank: "tourist" },
          { platform: "leetcode", handle: "lee215", solvedCount: 567, currentRating: 2400, maxRating: 2500, rank: "guardian" },
        ]);
      } catch {
        setError("Failed to load activity data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch activity for selected date
  useEffect(() => {
    async function fetchActivity() {
      try {
        // In a real app, call the API
        // const data = await fetch(`/api/activity?date=${selectedDate}&tz=${timezone}`).then(r => r.json());
        // For now, mock data
        if (Math.random() > 0.3) {
          setSolves([
            {
              id: "1",
              platform: "codeforces",
              handle: "tourist",
              problem: {
                externalId: "4-A",
                title: "Watermelon",
                url: "https://codeforces.com/contest/4/problem/A",
                rating: 800,
                tags: ["brute force", "math"],
              },
              language: "GNU C++17",
              submittedAt: new Date(`${selectedDate}T10:30:00Z`),
              isContest: false,
            },
            {
              id: "2",
              platform: "leetcode",
              handle: "lee215",
              problem: {
                externalId: "two-sum",
                title: "Two Sum",
                url: "https://leetcode.com/problems/two-sum/",
                rating: undefined,
                tags: ["array", "hash-table"],
              },
              language: "Python3",
              submittedAt: new Date(`${selectedDate}T14:45:00Z`),
              isContest: false,
            },
          ]);
        } else {
          setSolves([]);
        }
        setContests([]);
      } catch (err) {
        console.error("Failed to fetch activity:", err);
      }
    }
    fetchActivity();
  }, [selectedDate, timezone]);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = direction === "prev" 
      ? subDays(parseISO(selectedDate), 1)
      : addDays(parseISO(selectedDate), 1);
    setSelectedDate(newDate.toISOString().split("T")[0]!);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]!);
  };

  const isToday = isSameDay(parseISO(selectedDate), new Date());

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <p className="terminal-header" style={{ marginBottom: "0.25rem" }}>
          ~/activity $
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Daily Activity</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.375rem" }}>
          Browse your coding activity by day
        </p>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="card" style={{ padding: "1.5rem" }}>
          <p className="terminal-header" style={{ marginBottom: "0.5rem" }}>Current Streak</p>
          <StreakCounter streak={streak} size="md" />
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <p className="terminal-header" style={{ marginBottom: "0.5rem" }}>Total Platforms</p>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
            {platformStats.length}
          </div>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <p className="terminal-header" style={{ marginBottom: "0.5rem" }}>Today&apos;s Solves</p>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
            {solves.length}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <p className="terminal-header" style={{ marginBottom: "1rem" }}>365-Day Heatmap</p>
        <Heatmap
          data={heatmapData}
          onCellClick={(date) => setSelectedDate(date)}
          cellSize={13}
          gap={3}
        />
      </div>

      {/* Date navigator + Timeline */}
      <div className="card" style={{ padding: "1.5rem" }}>
        {/* Date strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => navigateDate("prev")}
              disabled={isLoading}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
              }}
            >
              ← Prev
            </button>
            <div style={{ textAlign: "center", minWidth: 180 }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {format(parseISO(selectedDate), "EEEE")}
              </p>
              <p style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0.25rem 0 0", fontFamily: "var(--font-mono)" }}>
                {format(parseISO(selectedDate), "MMMM d, yyyy")}
              </p>
            </div>
            <button
              onClick={() => navigateDate("next")}
              disabled={isLoading || isToday}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-surface)",
                color: isToday ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: isToday ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                opacity: isToday ? 0.5 : 1,
              }}
            >
              Next →
            </button>
          </div>
          <button
            onClick={goToToday}
            disabled={isToday || isLoading}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              backgroundColor: "var(--accent)",
              color: "var(--text-inverse)",
              cursor: isToday ? "not-allowed" : "pointer",
              fontSize: "0.8125rem",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              opacity: isToday ? 0.5 : 1,
            }}
          >
            Today
          </button>
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-tertiary)" }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 1rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p>Loading activity...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
            <p>{error}</p>
          </div>
        ) : (
          <ActivityTimeline
            solves={solves}
            contests={contests}
            date={selectedDate}
            timezone={timezone}
          />
        )}
      </div>

      {/* Platform stats */}
      {platformStats.length > 0 && (
        <div className="card" style={{ padding: "1.5rem", marginTop: "2rem" }}>
          <p className="terminal-header" style={{ marginBottom: "1rem" }}>Platform Statistics</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {platformStats.map((stat) => (
              <div
                key={stat.platform}
                style={{
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "8px",
                      backgroundColor: `${PLATFORM_COLORS[stat.platform] || "var(--accent)"}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                    }}
                  >
                    {PLATFORM_ICONS[stat.platform] || "📝"}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600 }}>
                      {stat.platform.charAt(0).toUpperCase() + stat.platform.slice(1)}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                      @{stat.handle}
                    </p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", textAlign: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                      {stat.solvedCount?.toLocaleString() ?? 0}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Solved</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                      {stat.currentRating ?? "—"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Rating</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                      {stat.maxRating ?? "—"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Peak</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

// Platform colors and icons (duplicated for client component)
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