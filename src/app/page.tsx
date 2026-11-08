import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { LandingScreen } from "@/v2/screens/LandingScreen";
import { loadLeaderboardPeople, loadUpcomingContests } from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "DevTrack — DSA progress across every platform",
  description:
    "Track Codeforces, LeetCode, AtCoder, and CodeChef in one place. Contests, public profiles, and teams.",
};

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await auth();
  const [contests, leaderboard] = await Promise.all([
    loadUpcomingContests(21),
    loadLeaderboardPeople(48),
  ]);
  const serialized = contests.map((c) => ({
    ...c,
    startsAt:
      c.startsAt instanceof Date ? c.startsAt.toISOString() : String(c.startsAt),
  }));

  return (
    <LandingScreen
      contests={serialized}
      leaderboard={leaderboard}
      signedIn={!!session?.user?.id}
    />
  );
}
