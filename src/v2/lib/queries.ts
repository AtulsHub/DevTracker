/**
 * Server-side data loaders for v2 screens (uses existing Drizzle services).
 */
import { db } from "@/server/db";
import { users, platformAccounts, solves } from "@/server/db/schema";
import { eq, count, sql } from "drizzle-orm";
import {
  countUpcomingContests,
  getUpcomingContests,
  refreshContestsFromAdapters,
} from "@/server/services/contests";
import {
  getHeatmapByPlatform,
  getPlatformStats,
  getRecentSolves,
  getStreak,
  getTotalSolved,
  getDailyActivity,
} from "@/server/services/activity";
import { todayLocalDateStr } from "@/lib/date";
import { contests } from "@/server/db/schema";

/**
 * Ensure the DB has upcoming contests. Refreshes from aggregators/adapters when
 * there are zero upcoming rows (not only when the table is completely empty).
 */
export async function ensureContestsLoaded() {
  const upcoming = await countUpcomingContests(60).catch(() => 0);
  if (upcoming > 0) return;

  const [{ c }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(contests);
  // Always try a refresh when nothing upcoming is visible.
  if (Number(c) === 0 || upcoming === 0) {
    await refreshContestsFromAdapters().catch((err) => {
      console.error("[ensureContestsLoaded] refresh failed:", err);
      return null;
    });
  }
}

export async function loadUpcomingContests(days = 30) {
  await ensureContestsLoaded();
  let rows = await getUpcomingContests(undefined, days).catch(() => []);
  // One retry after a forced refresh if still empty (covers stale FAILED syncs).
  if (rows.length === 0) {
    await refreshContestsFromAdapters().catch(() => null);
    rows = await getUpcomingContests(undefined, days).catch(() => []);
  }
  return rows;
}

export async function loadDashboardData(userId: string) {
  const today = todayLocalDateStr();
  const [
    heatmapSeries,
    streak,
    platforms,
    todayActivity,
    recent,
    totalSolved,
  ] = await Promise.all([
    getHeatmapByPlatform(userId),
    getStreak(userId),
    getPlatformStats(userId),
    getDailyActivity(userId, today),
    getRecentSolves(userId, 80),
    getTotalSolved(userId),
  ]);
  return {
    heatmap: heatmapSeries.year.all,
    heatmapByPlatform: heatmapSeries.year.byPlatform,
    heatmapAllTime: heatmapSeries.allTime.all,
    heatmapAllTimeByPlatform: heatmapSeries.allTime.byPlatform,
    heatmapPlatforms: heatmapSeries.platforms,
    heatmapActiveYears: heatmapSeries.activeYears,
    streak,
    platforms,
    todaySolved: todayActivity.solvedCount,
    recent,
    totalSolved,
  };
}

export async function loadExploreUsers() {
  const publicUsers = await db.query.users.findMany({
    where: eq(users.profileVisibility, "PUBLIC"),
    columns: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      headline: true,
      profileVisibility: true,
    },
    limit: 50,
  });

  const result = [];
  for (const u of publicUsers) {
    if (!u.username) continue;
    const accounts = await db.query.platformAccounts.findMany({
      where: eq(platformAccounts.userId, u.id),
      columns: { platform: true },
    });
    const [solved] = await db
      .select({ total: count() })
      .from(solves)
      .where(eq(solves.userId, u.id));
    result.push({
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      headline: u.headline,
      profileVisibility: u.profileVisibility,
      platforms: accounts.map((a) => a.platform),
      totalSolved: Number(solved?.total ?? 0),
    });
  }
  return result;
}

export async function loadPublicProfile(
  username: string,
  viewerId: string | null,
) {
  const owner = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      headline: true,
      location: true,
      age: true,
      college: true,
      skills: true,
      websiteUrl: true,
      githubUrl: true,
      profileVisibility: true,
    },
  });
  if (!owner || !owner.username) return { notFound: true as const };

  const isOwner = viewerId === owner.id;
  const isPublic = owner.profileVisibility === "PUBLIC";

  // Strict UI rule: never fetch stats for non-public profiles (except owner).
  if (!isOwner && !isPublic) {
    return {
      notFound: false as const,
      locked: true as const,
      username: owner.username,
    };
  }

  const platforms = await getPlatformStats(owner.id);
  const recent = await getRecentSolves(owner.id, 15);
  const totalSolved = await getTotalSolved(owner.id);

  return {
    notFound: false as const,
    locked: false as const,
    isOwner,
    username: owner.username,
    displayName: owner.displayName,
    avatarUrl: owner.avatarUrl,
    bio: owner.bio,
    headline: owner.headline,
    location: owner.location,
    age: owner.age,
    college: owner.college,
    skills: owner.skills,
    websiteUrl: owner.websiteUrl,
    githubUrl: owner.githubUrl,
    platforms,
    recent,
    totalSolved,
  };
}

export async function loadUserTeams(userId: string) {
  const { getUserTeams } = await import("@/server/services/teams");
  try {
    return await getUserTeams(userId);
  } catch {
    return [];
  }
}
