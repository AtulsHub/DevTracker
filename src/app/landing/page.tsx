import type { Metadata } from "next";
import { LandingScreen } from "@/v2/screens/LandingScreen";
import { loadExploreUsers, loadUpcomingContests } from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "DevTrack — DSA progress across every platform",
  description:
    "Track Codeforces, LeetCode, HackerRank, AtCoder, and CodeChef in one place. Contests, public profiles, and teams.",
};

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [contests, featured] = await Promise.all([
    loadUpcomingContests(21),
    loadExploreUsers(),
  ]);
  const serialized = contests.map((c) => ({
    ...c,
    startsAt:
      c.startsAt instanceof Date ? c.startsAt.toISOString() : String(c.startsAt),
  }));

  return <LandingScreen contests={serialized} featured={featured} />;
}
