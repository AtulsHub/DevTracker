"use client";

/**
 * src/components/features/ActivityTimeline.tsx
 * Per-day timeline of solves and contest participations.
 */
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface Problem {
  externalId: string;
  title: string;
  url?: string;
  rating?: number;
  tags?: string[];
}

interface Solve {
  id: string;
  platform: string;
  handle: string;
  problem: Problem;
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

interface ActivityTimelineProps {
  solves: Solve[];
  contests: Contest[];
  date: string;
  timezone?: string;
  className?: string;
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

function formatTime(date: Date | string, timeZone?: string): string {
  const d = new Date(date);
  const zoned = timeZone ? toZonedTime(d, timeZone) : d;
  return format(zoned, "HH:mm");
}

function formatDate(date: Date | string, timeZone?: string): string {
  const d = new Date(date);
  const zoned = timeZone ? toZonedTime(d, timeZone) : d;
  return format(zoned, "EEEE, MMMM d, yyyy");
}

export function ActivityTimeline({
  solves,
  contests,
  date,
  timezone,
  className = "",
}: ActivityTimelineProps) {
  const hasActivity = solves.length > 0 || contests.length > 0;

  if (!hasActivity) {
    return (
      <div className={`activity-timeline ${className}`} style={{ padding: "2rem", textAlign: "center" }}>
        <div
          style={{
            fontSize: "3rem",
            marginBottom: "1rem",
            opacity: 0.5,
          }}
        >
          📭
        </div>
        <p style={{ fontSize: "1rem", color: "var(--text-secondary)", margin: 0 }}>
          No activity on {formatDate(date, timezone)}
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginTop: "0.5rem" }}>
          Link platforms and start solving to see your daily timeline here.
        </p>
      </div>
    );
  }

  // Combine and sort all activities by time
  const allActivities = [
    ...solves.map((s) => ({
      type: "solve" as const,
      time: new Date(s.submittedAt),
      data: s,
    })),
    ...contests.map((c) => ({
      type: "contest" as const,
      time: new Date(c.submittedAt),
      data: c,
    })),
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  return (
    <div className={`activity-timeline ${className}`} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Date header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "1rem",
          borderBottom: "1px solid var(--border)",
          marginBottom: "0.5rem",
        }}
      >
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {formatDate(date, timezone)}
          </p>
          <p style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0.25rem 0 0", fontFamily: "var(--font-mono)" }}>
            {solves.length} solve{solves.length !== 1 ? "s" : ""}{contests.length > 0 ? `, ${contests.length} contest${contests.length !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {solves.length > 0 && (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--accent-bg)",
                color: "var(--accent)",
                fontSize: "0.75rem",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
              }}
            >
              {solves.length} solved
            </span>
          )}
          {contests.length > 0 && (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                color: "#818cf8",
                fontSize: "0.75rem",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
              }}
            >
              {contests.length} contest{contests.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Timeline items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {allActivities.map((activity, index) => {
          const isSolve = activity.type === "solve";
          const data = activity.data as Solve | Contest;
          const platform = data.platform;
          const color = PLATFORM_COLORS[platform] || "var(--accent)";
          const icon = PLATFORM_ICONS[platform] || "📝";

          if (isSolve) {
            const solve = data as Solve;
            return (
              <div
                key={`solve-${solve.id}`}
                style={{
                  display: "flex",
                  gap: "1rem",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg-surface)",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Time column */}
                <div
                  style={{
                    width: 70,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 2,
                    paddingRight: "0.75rem",
                    borderRight: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatTime(solve.submittedAt, timezone)}
                  </span>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: color,
                      boxShadow: `0 0 8px ${color}80`,
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingLeft: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "1.125rem" }}>{icon}</span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: color,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {platform}
                    </span>
                    {solve.isContest && (
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "rgba(99, 102, 241, 0.15)",
                          color: "#818cf8",
                          fontSize: "0.625rem",
                          fontWeight: 600,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        Contest
                      </span>
                    )}
                    {solve.problem.rating && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {solve.problem.rating}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <a
                      href={solve.problem.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        textDecoration: "none",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = color)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                    >
                      {solve.problem.title}
                    </a>
                    {solve.problem.tags && solve.problem.tags.length > 0 && (
                      <span style={{ flex: 1, minWidth: 100 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.25rem" }}>
                          {solve.problem.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              style={{
                                padding: "2px 8px",
                                borderRadius: "var(--radius-sm)",
                                backgroundColor: "var(--bg-elevated)",
                                border: "1px solid var(--border)",
                                fontSize: "0.6875rem",
                                color: "var(--text-tertiary)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                          {solve.problem.tags.length > 4 && (
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "var(--radius-sm)",
                                backgroundColor: "var(--bg-elevated)",
                                border: "1px solid var(--border)",
                                fontSize: "0.6875rem",
                                color: "var(--text-tertiary)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              +{solve.problem.tags.length - 4} more
                            </span>
                          )}
                        </div>
                      </span>
                    )}
                  </div>

                  {solve.language && (
                    <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{solve.language}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          } else {
            const contest = data as Contest;
            return (
              <div
                key={`contest-${contest.contestId ?? index}`}
                style={{
                  display: "flex",
                  gap: "1rem",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg-surface)",
                  borderLeft: `4px solid ${color}`,
                }}
              >
                {/* Time column */}
                <div
                  style={{
                    width: 70,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 2,
                    paddingRight: "0.75rem",
                    borderRight: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatTime(contest.submittedAt, timezone)}
                  </span>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: color,
                      boxShadow: `0 0 8px ${color}80`,
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingLeft: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "1.125rem" }}>{icon}</span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: color,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {platform}
                    </span>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "rgba(99, 102, 241, 0.15)",
                        color: "#818cf8",
                        fontSize: "0.625rem",
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Contest
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-primary)" }}>
                      Contest participation
                    </span>
                    <span style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
                      ({contest.problemCount} problem{contest.problemCount !== 1 ? "s" : ""} attempted)
                    </span>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}