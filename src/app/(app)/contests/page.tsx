import type { Metadata } from "next";
import { ContestsScreen } from "@/v2/screens/ContestsScreen";
import { loadUpcomingContests } from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "Contests",
};

export const dynamic = "force-dynamic";

export default async function ContestsPage() {
  const contests = await loadUpcomingContests(60);
  const serialized = contests.map((c) => ({
    ...c,
    startsAt:
      c.startsAt instanceof Date ? c.startsAt.toISOString() : String(c.startsAt),
  }));
  return <ContestsScreen contests={serialized} />;
}
