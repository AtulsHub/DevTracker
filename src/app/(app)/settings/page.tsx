import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { ProfileSettingsScreen } from "@/v2/screens/ProfileSettingsScreen";

export const metadata: Metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-up?callbackUrl=/settings");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      headline: true,
      location: true,
      age: true,
      college: true,
      skills: true,
      websiteUrl: true,
      githubUrl: true,
      profileVisibility: true,
      timezone: true,
    },
  });

  if (!user?.username) redirect("/onboarding");

  return (
    <ProfileSettingsScreen
      user={{
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        headline: user.headline,
        location: user.location,
        age: user.age,
        college: user.college,
        skills: user.skills,
        websiteUrl: user.websiteUrl,
        githubUrl: user.githubUrl,
        profileVisibility: user.profileVisibility,
        timezone: user.timezone,
      }}
    />
  );
}
