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
  getAllSubmissions,
  getAcceptedSolveDetails,
  getStreak,
  getTotalSolved,
  getDailyActivity,
} from "@/server/services/activity";
import { getOverviewTargets } from "@/server/services/targets";
import { todayLocalDateStr } from "@/lib/date";
import { contests } from "@/server/db/schema";

export { getAllSubmissions };

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
    overviewTargets,
    acceptedSolves,
  ] = await Promise.all([
    getHeatmapByPlatform(userId),
    getStreak(userId),
    getPlatformStats(userId),
    getDailyActivity(userId, today),
    getRecentSolves(userId, 80, "accepted"),
    getTotalSolved(userId),
    getOverviewTargets(userId),
    getAcceptedSolveDetails(userId),
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
    overviewTargets,
    acceptedSolves,
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
      location: true,
      college: true,
      skills: true,
      profileVisibility: true,
    },
    limit: 80,
  });

  const result = [];
  for (const u of publicUsers) {
    if (!u.username) continue;
    const accounts = await db.query.platformAccounts.findMany({
      where: eq(platformAccounts.userId, u.id),
      columns: { platform: true, currentRating: true },
    });
    const [solved] = await db
      .select({ total: count() })
      .from(solves)
      .where(eq(solves.userId, u.id));
    const maxRating = accounts.reduce(
      (best, a) => Math.max(best, a.currentRating ?? 0),
      0,
    );
    result.push({
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      headline: u.headline,
      location: u.location,
      college: u.college,
      skills: u.skills,
      profileVisibility: u.profileVisibility,
      platforms: accounts.map((a) => a.platform),
      totalSolved: Number(solved?.total ?? 0),
      maxRating: maxRating || null,
    });
  }
  return result.sort((a, b) => b.totalSolved - a.totalSolved);
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
      linkedinUrl: true,
      twitterUrl: true,
      resumeUrl: true,
      education: true,
      experience: true,
      projects: true,
      certifications: true,
      customLinks: true,
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
    linkedinUrl: owner.linkedinUrl,
    twitterUrl: owner.twitterUrl,
    resumeUrl: owner.resumeUrl,
    education: owner.education ?? [],
    experience: owner.experience ?? [],
    projects: owner.projects ?? [],
    certifications: owner.certifications ?? [],
    customLinks: owner.customLinks ?? [],
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

export async function loadPublicTeams(limit = 24, query?: string) {
  const { getPublicTeams } = await import("@/server/services/teams");
  try {
    return await getPublicTeams(limit, 0, query);
  } catch {
    return [];
  }
}
