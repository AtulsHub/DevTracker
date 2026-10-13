import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/server/auth";
import { PublicProfileScreen } from "@/v2/screens/PublicProfileScreen";
import { loadPublicProfile } from "@/v2/lib/queries";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username}`,
    description: `Public coding profile for @${username} on DevTrack`,
  };
}

export const dynamic = "force-dynamic";

export default async function PublicUserPage({ params }: Props) {
  const { username } = await params;
  const session = await auth();
  const data = await loadPublicProfile(username, session?.user?.id ?? null);

  if (data.notFound) notFound();

  if (data.locked) {
    return <PublicProfileScreen locked username={data.username} />;
  }

  return (
    <PublicProfileScreen
      username={data.username}
      displayName={data.displayName}
      avatarUrl={data.avatarUrl}
      bio={data.bio}
      headline={data.headline}
      location={data.location}
      age={data.age}
      college={data.college}
      skills={data.skills}
      websiteUrl={data.websiteUrl}
      githubUrl={data.githubUrl}
      platforms={data.platforms}
      totalSolved={data.totalSolved}
      isOwner={data.isOwner}
      viewerSignedIn={!!session?.user?.id}
      recent={data.recent.map((r) => ({
        ...r,
        submittedAt:
          r.submittedAt instanceof Date
            ? r.submittedAt.toISOString()
            : String(r.submittedAt),
      }))}
    />
  );
}
