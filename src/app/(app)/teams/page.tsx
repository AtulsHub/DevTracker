import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { TeamsScreen } from "@/v2/screens/TeamsScreen";
import { loadUserTeams } from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "Teams",
};

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await auth();
  const signedIn = !!session?.user?.id;
  const teams = signedIn ? await loadUserTeams(session!.user!.id!) : [];

  return (
    <TeamsScreen
      signedIn={signedIn}
      teams={teams.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        visibility: t.visibility,
        memberCount: t.memberCount,
      }))}
    />
  );
}
