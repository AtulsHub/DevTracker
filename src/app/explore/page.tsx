import type { Metadata } from "next";
import { ExploreScreen } from "@/v2/screens/ExploreScreen";
import { loadExploreUsers } from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "Explore",
};

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const users = await loadExploreUsers();
  return <ExploreScreen users={users} />;
}
