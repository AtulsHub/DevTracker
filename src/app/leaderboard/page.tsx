import type { Metadata } from "next";
import { LeaderboardScreen } from "@/v2/screens/LeaderboardScreen";
import { loadLeaderboardPeople } from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Rank DevTrack grinders by platform rating and total problems solved.",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const people = await loadLeaderboardPeople(100);
  return <LeaderboardScreen people={people} />;
}
