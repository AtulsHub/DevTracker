import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { TeamsScreen } from "@/v2/screens/TeamsScreen";
import { loadPublicTeams, loadUserTeams } from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "Teams",
};

export const dynamic = "force-dynamic";

function mapTeam(t: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  memberCount: number;
  avatarUrl?: string | null;
}) {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    visibility: t.visibility,
    memberCount: t.memberCount,
    avatarUrl: t.avatarUrl ?? null,
  };
}

export default async function TeamsPage() {
  const session = await auth();
  const signedIn = !!session?.user?.id;
  const [teams, discover] = await Promise.all([
    signedIn ? loadUserTeams(session!.user!.id!) : Promise.resolve([]),
    loadPublicTeams(24),
  ]);

  const myIds = new Set(teams.map((t) => t.id));

  return (
    <TeamsScreen
      signedIn={signedIn}
      teams={teams.map(mapTeam)}
      discover={discover.filter((t) => !myIds.has(t.id)).map(mapTeam)}
    />
  );
}
