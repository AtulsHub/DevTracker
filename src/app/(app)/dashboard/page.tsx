/**
 * src/app/(app)/dashboard/page.tsx
 * Main dashboard — shows greeting, streak, today card, heatmap, upcoming contests.
 * Protected by middleware (requires authenticated session).
 */
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getHeatmapData, getStreak, getPlatformStats, getDailyActivity } from "@/server/services/activity";
import { Heatmap } from "@/components/features/Heatmap";
import { StreakCounter } from "@/components/features/StreakCounter";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const userId = session.user.id;
  const username = session.user.name ?? session.user.email ?? "Developer";

  // Fetch data in parallel
  const [heatmapData, streak, platformStats, todayActivity] = await Promise.all([
    getHeatmapData(userId),
    getStreak(userId),
    getPlatformStats(userId),
    getDailyActivity(userId, new Date().toISOString().split("T")[0]!),
  ]);

  const todaySolved = todayActivity.solvedCount;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* ── Greeting ── */}
      <div style={{ marginBottom: "2rem" }}>
        <p className="terminal-header" style={{ marginBottom: "0.25rem" }}>
          ~/dashboard $
        </p>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Welcome back,{" "}
          <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
            {username}
          </span>
          <span
            className="cursor-blink"
            style={{ fontFamily: "var(--font-mono)", marginLeft: "2px" }}
          />
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.375rem" }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* ── Bento grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Today card */}
        <div className="card" style={{ padding: "1.5rem", gridColumn: "span 2" }}>
          <p className="terminal-header" style={{ marginBottom: "0.5rem" }}>Today</p>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "3rem",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: "var(--accent)",
                lineHeight: 1,
              }}
            >
              {todaySolved}
            </span>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              problem{todaySolved !== 1 ? "s" : ""} solved today
            </span>
          </div>
          {todaySolved === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
              Link your platforms to start tracking →
            </p>
          ) : (
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Great progress! Keep it up 🚀
            </p>
          )}
        </div>

        {/* Streak card */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <p className="terminal-header" style={{ marginBottom: "0.5rem" }}>Streak</p>
          <StreakCounter streak={streak} size="md" />
        </div>

        {/* Heatmap card */}
        <div className="card" style={{ padding: "1.5rem", gridColumn: "1 / -1" }}>
          <p className="terminal-header" style={{ marginBottom: "1rem" }}>Activity Heatmap (365 days)</p>
          {heatmapData.some((d) => d.count > 0) ? (
            <Heatmap data={heatmapData} cellSize={13} gap={3} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "140px",
                borderRadius: "var(--radius-sm)",
                background: "repeating-linear-gradient(90deg, var(--bg-elevated) 0px, var(--bg-elevated) 11px, transparent 11px, transparent 13px)",
                opacity: 0.5,
              }}
            />
          )}
          {heatmapData.some((d) => d.count > 0) ? null : (
            <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.5rem" }}>
              Link platforms to see your contribution heatmap here.
            </p>
          )}
        </div>

        {/* Platforms card */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <p className="terminal-header" style={{ marginBottom: "0.75rem" }}>Linked Platforms</p>
          {platformStats.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {platformStats.map((p) => (
                <div
                  key={p.platform}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg-elevated)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "8px",
                        backgroundColor: `${PLATFORM_COLORS[p.platform] || "var(--accent)"}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.125rem",
                      }}
                    >
                      {PLATFORM_ICONS[p.platform] || "📝"}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500 }}>
                        {p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}
                      </h4>
                      <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                        @{p.handle}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 80 }}>
                    <p style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                      {p.solvedCount?.toLocaleString() ?? 0}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.625rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Solved</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[
                { name: "Codeforces", color: "#1976D2", icon: "📊" },
                { name: "LeetCode", color: "#FFA116", icon: "🔥" },
                { name: "AtCoder", color: "#006FCC", icon: "🇯🇵" },
                { name: "CodeChef", color: "#5B4638", icon: "👨‍🍳" },
              ].map((p) => (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg-elevated)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "8px",
                        backgroundColor: `${p.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.125rem",
                      }}
                    >
                      {p.icon}
                    </span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500 }}>{p.name}</h4>
                      <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                        Not linked
                      </p>
                    </div>
                  </div>
                  <a
                    href="/settings"
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--accent)",
                      textDecoration: "none",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Link →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming contests */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <p className="terminal-header" style={{ marginBottom: "0.75rem" }}>Upcoming Contests</p>
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "0.8125rem",
              fontFamily: "var(--font-mono)",
            }}
          >
            {"// no contests loaded yet"}
            <br />
            {"// sync will run automatically"}
          </div>
        </div>
      </div>
    </div>
  );
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