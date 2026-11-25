/**
 * Server-side data loaders for v2 screens (uses existing Drizzle services).
 */
import { db } from "@/server/db";
import { unstable_cache } from "next/cache";
import { DISCOVERABLE_PUBLIC_PEOPLE_TAG } from "@/server/cache-tags";
import { users, platformAccounts } from "@/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
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
import { isPlaceholderUsername } from "@/lib/username";

export { getAllSubmissions };

/**
 * Read-only contest load for pages. Do NOT refresh aggregators on the request
 * path — that made `/` take multi-seconds. Cron `/api/cron/refresh-contests`
 * owns refreshes.
 */
const getCachedUpcomingContests = unstable_cache(
  async (days: number) => getUpcomingContests(undefined, days),
  ["upcoming-contests"],
  { revalidate: 60, tags: ["upcoming-contests"] },
);

export async function loadUpcomingContests(days = 30) {
  return getCachedUpcomingContests(days).catch(() => []);
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
  const platformsPromise = getPlatformStats(userId);
  const totalSolvedPromise = platformsPromise.then((platforms) =>
    getTotalSolved(userId, platforms),
  );
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
    platformsPromise,
    getDailyActivity(userId, today),
    getRecentSolves(userId, 80, "accepted"),
    totalSolvedPromise,
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

export async function loadHomeData(userId: string) {
  const platformsPromise = getPlatformStats(userId);
  const totalSolvedPromise = platformsPromise.then((platforms) =>
    getTotalSolved(userId, platforms),
  );
  const [streak, platforms, todayActivity, totalSolved, overviewTargets] =
    await Promise.all([
      getStreak(userId),
      platformsPromise,
      getDailyActivity(userId, todayLocalDateStr()),
      totalSolvedPromise,
      getOverviewTargets(userId),
    ]);

  return {
    streak,
    platforms,
    todaySolved: todayActivity.solvedCount,
    totalSolved,
    overviewTargets,
  };
}

type DiscoverablePublicPerson = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  location: string | null;
  college: string | null;
  skills: string | null;
  platforms: Array<{
    platform: string;
    handle: string;
    currentRating: number | null;
    maxRating: number | null;
  }>;
  totalSolved: number;
};

const loadDiscoverablePublicPeople = unstable_cache(
  async (): Promise<DiscoverablePublicPerson[]> => {
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
      },
    });

    const candidates = publicUsers.filter(
      (u): u is typeof u & { username: string } =>
        !!u.username && !isPlaceholderUsername(u.username),
    );
    if (candidates.length === 0) return [];

    const ids = candidates.map((u) => u.id);
    const [accounts, solvedByUser] = await Promise.all([
      db.query.platformAccounts.findMany({
        where: inArray(platformAccounts.userId, ids),
        columns: {
          userId: true,
          platform: true,
          handle: true,
          currentRating: true,
          maxRating: true,
        },
      }),
      getTotalSolvedByUserIds(ids),
    ]);

    const accountsByUser = new Map<
      string,
      DiscoverablePublicPerson["platforms"]
    >();
    for (const account of accounts) {
      const list = accountsByUser.get(account.userId) ?? [];
      list.push({
        platform: account.platform,
        handle: account.handle,
        currentRating: account.currentRating,
        maxRating: account.maxRating,
      });
      accountsByUser.set(account.userId, list);
    }

    return candidates.map((user) => ({
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      headline: user.headline,
      location: user.location,
      college: user.college,
      skills: user.skills,
      platforms: accountsByUser.get(user.id) ?? [],
      totalSolved: solvedByUser.get(user.id) ?? 0,
    }));
  },
  ["discoverable-public-people-v1"],
  { revalidate: 60, tags: [DISCOVERABLE_PUBLIC_PEOPLE_TAG] },
);

/**
 * Featured list for landing/home — same solved totals as Explore / public profiles.
 */
export async function loadFeaturedUsers(limit = 8) {
  const take = Math.min(limit, 24);
  const people = await loadDiscoverablePublicPeople();
  return [...people]
    .map((user) => ({
      username: user.username,
      displayName: user.displayName,
      headline: user.headline,
      platforms: user.platforms.map((account) => account.platform),
      totalSolved: user.totalSolved,
    }))
    .sort((a, b) => {
      if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
      return a.username.localeCompare(b.username);
    })
    .slice(0, take);
}

export async function loadExploreUsers(limit = 24) {
  const take = Math.min(limit, 48);
  const people = await loadDiscoverablePublicPeople();
  return [...people]
    .map((user) => ({
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      headline: user.headline,
      location: user.location,
      college: user.college,
      skills: user.skills,
      profileVisibility: "PUBLIC",
      platforms: user.platforms.map((account) => account.platform),
      totalSolved: user.totalSolved,
      maxRating:
        user.platforms.reduce(
          (best, account) => Math.max(best, account.currentRating ?? 0),
          0,
        ) || null,
    }))
    .sort((a, b) => b.totalSolved - a.totalSolved)
    .slice(0, take);
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

export type LeaderboardPerson = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  totalSolved: number;
  bestRating: number;
  byPlatform: Partial<
    Record<
      string,
      { rating: number; peak: number | null; handle: string }
    >
  >;
};

/**
 * Public discoverable profiles with solved + per-platform ratings
 * for client-side leaderboard ranking.
 */
export async function loadLeaderboardPeople(
  limit = 100,
): Promise<LeaderboardPerson[]> {
  const take = Math.min(limit, 200);
  const peopleData = await loadDiscoverablePublicPeople();
  const people: LeaderboardPerson[] = [];
  for (const user of peopleData) {
    const byPlatform: LeaderboardPerson["byPlatform"] = {};
    let bestRating = 0;
    for (const account of user.platforms) {
      const rating = Math.max(
        account.currentRating ?? 0,
        account.maxRating ?? 0,
      );
      if (rating <= 0 && !account.handle) continue;
      if (rating > 0) {
        byPlatform[account.platform] = {
          rating:
            account.currentRating && account.currentRating > 0
              ? account.currentRating
              : rating,
          peak:
            account.maxRating && account.maxRating > 0
              ? account.maxRating
              : null,
          handle: account.handle,
        };
        bestRating = Math.max(bestRating, rating);
      } else if (account.handle) {
        // Linked but unrated — still useful for solved board context
        byPlatform[account.platform] = {
          rating: 0,
          peak: null,
          handle: account.handle,
        };
      }
    }
    people.push({
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      headline: user.headline,
      totalSolved: user.totalSolved,
      bestRating,
      byPlatform,
    });
  }

  // Prefer people with any signal; still include zeros if board is tiny.
  people.sort((a, b) => {
    const scoreA = Math.max(a.bestRating, a.totalSolved);
    const scoreB = Math.max(b.bestRating, b.totalSolved);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.username.localeCompare(b.username);
  });

  return people.slice(0, take);
}
