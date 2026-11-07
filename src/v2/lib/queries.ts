/**
 * Server-side data loaders for v2 screens (uses existing Drizzle services).
 */
import { db } from "@/server/db";
import { users, platformAccounts } from "@/server/db/schema";
import { and, eq, desc, inArray } from "drizzle-orm";
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
  getTotalSolvedByUserIds,
  getDailyActivity,
} from "@/server/services/activity";
import { getOverviewTargets } from "@/server/services/targets";
import { todayLocalDateStr } from "@/lib/date";

export { getAllSubmissions };

/**
 * Read-only contest load for pages. Do NOT refresh aggregators on the request
 * path — that made `/` take multi-seconds. Cron `/api/cron/refresh-contests`
 * owns refreshes.
 */
export async function loadUpcomingContests(days = 30) {
  return getUpcomingContests(undefined, days).catch(() => []);
}

/** Manual/scripts only — pages should not call this. */
export async function ensureContestsLoaded() {
  const upcoming = await countUpcomingContests(60).catch(() => 0);
  if (upcoming > 0) return;
  await refreshContestsFromAdapters().catch((err) => {
    console.error("[ensureContestsLoaded] refresh failed:", err);
  });
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

/**
 * Lightweight featured list for landing/home (no N+1).
 * Explore page still uses loadExploreUsers for richer cards.
 */
export async function loadFeaturedUsers(limit = 8) {
  const publicUsers = await db
    .select({
      username: users.username,
      displayName: users.displayName,
      headline: users.headline,
    })
    .from(users)
    .where(
      and(
        eq(users.profileVisibility, "PUBLIC"),
        eq(users.discoverable, true),
      ),
    )
    .orderBy(desc(users.createdAt))
    .limit(Math.min(limit, 24));

  return publicUsers.filter((u) => !!u.username);
}

export async function loadExploreUsers(limit = 24) {
  const take = Math.min(limit, 48);
  // Fetch a wider candidate set, then rank by the same solved totals as /u.
  const publicUsers = await db.query.users.findMany({
    where: and(
      eq(users.profileVisibility, "PUBLIC"),
      eq(users.discoverable, true),
    ),
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
    orderBy: [desc(users.createdAt)],
    limit: Math.max(take, 120),
  });

  if (publicUsers.length === 0) return [];

  const ids = publicUsers.map((u) => u.id);
  const [accounts, solvedByUser] = await Promise.all([
    db.query.platformAccounts.findMany({
      where: inArray(platformAccounts.userId, ids),
      columns: {
        userId: true,
        platform: true,
        currentRating: true,
      },
    }),
    getTotalSolvedByUserIds(ids),
  ]);

  const accountsByUser = new Map<string, typeof accounts>();
  for (const a of accounts) {
    const list = accountsByUser.get(a.userId) ?? [];
    list.push(a);
    accountsByUser.set(a.userId, list);
  }

  const result = [];
  for (const u of publicUsers) {
    if (!u.username) continue;
    const userAccounts = accountsByUser.get(u.id) ?? [];
    // Match public profile “Best rating” (highest currentRating across platforms).
    const maxRating = userAccounts.reduce(
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
      platforms: userAccounts.map((a) => a.platform),
      totalSolved: solvedByUser.get(u.id) ?? 0,
      maxRating: maxRating || null,
    });
  }
  return result.sort((a, b) => b.totalSolved - a.totalSolved).slice(0, take);
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
      openToWork: true,
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
    openToWork: owner.openToWork,
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
