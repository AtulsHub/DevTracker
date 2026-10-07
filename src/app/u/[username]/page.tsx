/**
 * src/app/u/[username]/page.tsx
 * Public profile page - respects privacy settings via canView()
 */
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/server/db";
import { users, platformAccounts, dailyActivity, solves, problems, follows } from "@/server/db/schema";
import { eq, and, count, sql, desc, gte, lte } from "drizzle-orm";
import { canView, canViewFields } from "@/server/privacy/can-view";
import { Heatmap } from "@/components/features/Heatmap";
import { StreakCounter } from "@/components/features/StreakCounter";
import { format, subDays } from "date-fns";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} | DevTrack`,
    description: `View ${username}'s coding profile on DevTrack`,
    openGraph: {
      title: `@${username} on DevTrack`,
      description: `View ${username}'s coding profile, stats, and activity`,
    },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  // Find the profile owner
  const owner = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      profileVisibility: true,
      createdAt: true,
      timezone: true,
    },
  });

  if (!owner) {
    notFound();
  }

  // Check if viewer can see this profile at all
  const canSeeActivityFeed = await canView(viewerId, owner.id, "activity_feed");
  const canSeeProfile = viewerId === owner.id || canSeeActivityFeed || owner.profileVisibility === "PUBLIC";

  if (!canSeeProfile && viewerId !== owner.id) {
    // Profile is private and viewer is not authorized
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔒</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Private Profile</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          This profile is private. {viewerId ? "You don't have permission to view it." : "Sign in to request access."}
        </p>
        {viewerId && owner.profileVisibility !== "PRIVATE" && (
          <button
            onClick={() => {
              // Trigger follow request
              fetch(`/api/follow/${username}`, { method: "POST" })
                .then((r) => r.json())
                .then((data) => alert(data.message || "Follow request sent!"));
            }}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent)",
              color: "var(--text-inverse)",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Request to Follow
          </button>
        )}
      </div>
    );
  }

  // Get field-level visibility
  const fieldVisibility = await canViewFields(viewerId, owner.id, [
    "activity_feed",
    "solved_problem_details",
    "ratings",
    "heatmap",
    "linked_handles",
    "contest_history",
  ]);

  // Fetch linked platforms (if visible)
  let platformAccountsList: Array<{
    platform: string;
    handle: string;
    currentRating: number | null;
    maxRating: number | null;
    rank: string | null;
  }> = [];

  if (fieldVisibility.linked_handles) {
    platformAccountsList = await db.query.platformAccounts.findMany({
      where: and(eq(platformAccounts.userId, owner.id), eq(platformAccounts.syncStatus, "success")),
      columns: { platform: true, handle: true, currentRating: true, maxRating: true, rank: true },
    });
  }

  // Fetch heatmap data (if visible)
  const heatmapData: Array<{ date: string; count: number }> = fieldVisibility.heatmap
    ? (() => {
        const endDate = new Date();
        const startDate = subDays(endDate, 364);
        const activities = await db.query.dailyActivity.findMany({
          where: and(
            eq(dailyActivity.userId, owner.id),
            gte(dailyActivity.date, startDate.toISOString().split("T")[0]!),
            lte(dailyActivity.date, endDate.toISOString().split("T")[0]!)
          ),
        });
        const activityMap = new Map(activities.map((a) => [a.date, a.solvedCount]));
        const result: Array<{ date: string; count: number }> = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0]!;
          result.push({ date: dateStr, count: activityMap.get(dateStr) ?? 0 });
        }
        return result;
      })()
    : [];

  // Fetch streak (if heatmap visible)
  let streak = 0;
  if (fieldVisibility.heatmap) {
    // Simple streak calculation
    const sortedDates = heatmapData.filter((d) => d.count > 0).map((d) => d.date).sort().reverse();
    const today = new Date().toISOString().split("T")[0]!;
    let currentStreak = 0;
    let checkDate = today;
    if (!sortedDates.includes(today)) {
      checkDate = subDays(new Date(), 1).toISOString().split("T")[0]!;
    }
    for (const date of sortedDates) {
      if (date === checkDate) {
        currentStreak++;
        checkDate = subDays(new Date(checkDate), 1).toISOString().split("T")[0]!;
      } else if (date < checkDate) {
        break;
      }
    }
    streak = currentStreak;
  }

  // Fetch stats
  const totalSolvesResult = await db
    .select({ count: count() })
    .from(solves)
    .where(eq(solves.userId, owner.id));

  const totalContestsResult = await db
    .select({ count: count() })
    .from(solves)
    .where(and(eq(solves.userId, owner.id), eq(solves.solvedInContest, true)));

  const totalSolves = (totalSolvesResult[0]?.count as number) ?? 0;
  const totalContests = (totalContestsResult[0]?.count as number) ?? 0;

  // Get follower/following counts
  const [followersCountResult, followingCountResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(follows)
      .where(and(eq(follows.followeeId, owner.id), eq(follows.status, "ACCEPTED"))),
    db
      .select({ count: count() })
      .from(follows)
      .where(and(eq(follows.followerId, owner.id), eq(follows.status, "ACCEPTED"))),
  ]);

  const followersCount = (followersCountResult[0]?.count as number) ?? 0;
  const followingCount = (followingCountResult[0]?.count as number) ?? 0;

  // Check follow status if authenticated
  let followStatus: "NONE" | "PENDING" | "ACCEPTED" | "BLOCKED" = "NONE";
  if (viewerId && viewerId !== owner.id) {
    const follow = await db.query.follows.findFirst({
      where: and(eq(follows.followerId, viewerId), eq(follows.followeeId, owner.id)),
      columns: { status: true },
    });
    followStatus = follow?.status ?? "NONE";
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

  const displayName = owner.displayName ?? owner.username;

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      {/* Profile Header */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", marginBottom: "2rem", alignItems: "flex-start" }}>
        <div style={{ width: 100, height: 100, borderRadius: "16px", backgroundColor: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", overflow: "hidden", flexShrink: 0 }}>
          {owner.avatarUrl ? (
            <img src={owner.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span>👤</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>{displayName}</h1>
            <span style={{ fontSize: "1.125rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              @{owner.username}
            </span>
            {owner.profileVisibility === "PRIVATE" && (
              <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase" }}>Private</span>
            )}
            {owner.profileVisibility === "FOLLOWERS_ONLY" && (
              <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase" }}>Followers Only</span>
            )}
          </div>
          {owner.bio && <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0", lineHeight: 1.5 }}>{owner.bio}</p>}
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.5rem" }}>
            Member since {format(new Date(owner.createdAt), "MMMM yyyy")}
          </p>
        </div>
        {viewerId && viewerId !== owner.id && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {followStatus === "NONE" && (
              <button
                onClick={async () => {
                  const res = await fetch(`/api/follow/${username}`, { method: "POST" });
                  const data = await res.json();
                  if (data.ok) window.location.reload();
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--accent)",
                  color: "var(--text-inverse)",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Follow
              </button>
            )}
            {followStatus === "PENDING" && (
              <span style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b", fontWeight: 600, fontSize: "0.875rem" }}>
                Pending
              </span>
            )}
            {followStatus === "ACCEPTED" && (
              <button
                onClick={async () => {
                  const res = await fetch(`/api/follow/${username}`, { method: "DELETE" });
                  if (res.ok) window.location.reload();
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Following
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
            {totalSolves}
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Problems Solved</p>
        </div>
        <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
            {totalContests}
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Contests</p>
        </div>
        <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
          <StreakCounter streak={streak} size="sm" showLabel={false} />
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Streak</p>
        </div>
        <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
            {followersCount}
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Followers</p>
        </div>
        <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
            {followingCount}
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Following</p>
        </div>
      </div>

      {/* Linked Platforms */}
      {fieldVisibility.linked_handles && platformAccountsList.length > 0 && (
        <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <p className="terminal-header" style={{ marginBottom: "1rem" }}>Linked Platforms</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {platformAccountsList.map((acc) => (
              <div
                key={`${acc.platform}-${acc.handle}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    backgroundColor: `${PLATFORM_COLORS[acc.platform] || "var(--accent)"}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.125rem",
                  }}
                >
                  {PLATFORM_ICONS[acc.platform] || "📝"}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500 }}>
                    {acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1)}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                    @{acc.handle}
                  </p>
                </div>
                {fieldVisibility.ratings && (acc.currentRating || acc.maxRating) && (
                  <div style={{ marginLeft: "auto", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                    {acc.currentRating && <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--accent)" }}>{acc.currentRating}</p>}
                    {acc.maxRating && <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>Peak: {acc.maxRating}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      {fieldVisibility.heatmap && heatmapData.length > 0 && (
        <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <p className="terminal-header" style={{ marginBottom: "1rem" }}>Activity Heatmap (365 days)</p>
          <Heatmap data={heatmapData} cellSize={13} gap={3} />
        </div>
      )}

      {/* Activity feed would go here if visible */}
      {fieldVisibility.activity_feed && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <p className="terminal-header" style={{ marginBottom: "1rem" }}>Recent Activity</p>
          <p style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "2rem" }}>
            Activity feed coming soon...
          </p>
        </div>
      )}

      {!fieldVisibility.activity_feed && viewerId !== owner.id && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
          <p>Activity feed is private.</p>
          {followStatus === "NONE" && (
            <button
              onClick={async () => {
                const res = await fetch(`/api/follow/${username}`, { method: "POST" });
                const data = await res.json();
                if (data.ok) window.location.reload();
              }}
              style={{ marginTop: "1rem", padding: "10px 20px", borderRadius: "var(--radius-md)", backgroundColor: "var(--accent)", color: "var(--text-inverse)", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              Request to Follow
            </button>
          )}
        </div>
      )}
    </div>
  );
}