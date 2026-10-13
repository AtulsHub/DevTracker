/**
 * Server-side data loaders for v2 screens (uses existing Drizzle services).
 */
import { db } from "@/server/db";
import { users, platformAccounts, solves } from "@/server/db/schema";
import { eq, count, sql } from "drizzle-orm";
import {
  getUpcomingContests,
  refreshContestsFromAdapters,
} from "@/server/services/contests";
import {
  getHeatmapData,
  getPlatformStats,
  getRecentSolves,
  getStreak,
  getTotalSolved,
  getDailyActivity,
} from "@/server/services/activity";
import { todayLocalDateStr } from "@/lib/date";
import { contests } from "@/server/db/schema";

export async function ensureContestsLoaded() {
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(contests);
  if (Number(c) === 0) {
    await refreshContestsFromAdapters().catch(() => null);
  }
}

export async function loadUpcomingContests(days = 30) {
  await ensureContestsLoaded();
  return getUpcomingContests(undefined, days).catch(() => []);
}

export async function loadDashboardData(userId: string) {
  const today = todayLocalDateStr();
  const [
    heatmap,
    streak,
    platforms,
    todayActivity,
    recent,
    totalSolved,
  ] = await Promise.all([
    getHeatmapData(userId),
    getStreak(userId),
    getPlatformStats(userId),
    getDailyActivity(userId, today),
    getRecentSolves(userId, 12),
    getTotalSolved(userId),
  ]);
  return {
    heatmap,
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
