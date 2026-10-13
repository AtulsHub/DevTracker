import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { HomeScreen } from "@/v2/screens/HomeScreen";
import { LandingScreen } from "@/v2/screens/LandingScreen";
import {
  loadDashboardData,
  loadExploreUsers,
  loadUpcomingContests,
} from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "DevTrack — DSA progress across every platform",
  description:
    "Track Codeforces, LeetCode, HackerRank, AtCoder, and CodeChef in one place. Contests, public profiles, and teams.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const signedIn = !!session?.user?.id;
  const [contests, featured] = await Promise.all([
    loadUpcomingContests(21),
    loadExploreUsers(),
  ]);
  const serialized = contests.map((c) => ({
    ...c,
    startsAt:
      c.startsAt instanceof Date ? c.startsAt.toISOString() : String(c.startsAt),
  }));

  if (!signedIn) {
    return <LandingScreen contests={serialized} featured={featured} />;
  }

  let quickStats: {
    totalSolved: number;
    streak: number;
    platforms: number;
  } | null = null;

  if (session?.user?.id) {
    const dash = await loadDashboardData(session.user.id);
    quickStats = {
      totalSolved: dash.totalSolved,
      streak: dash.streak,
      platforms: dash.platforms.length,
    };
  }

  return (
    <HomeScreen
      signedIn
      username={session?.user?.name ?? session?.user?.email}
      contests={serialized}
      quickStats={quickStats}
      featured={featured}
    />
  );
}
