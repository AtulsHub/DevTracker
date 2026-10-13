import type { Metadata } from "next";
import { TeamDetailScreen } from "@/v2/screens/TeamDetailScreen";

export const metadata: Metadata = {
  title: "Team",
};

export default async function TeamSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TeamDetailScreen slug={slug} />;
}
