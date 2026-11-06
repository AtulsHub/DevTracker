import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { ProfileSettingsScreen } from "@/v2/screens/ProfileSettingsScreen";

export const metadata: Metadata = {
  title: "Edit profile",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-up?callbackUrl=/profile");

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
      linkedinUrl: true,
      twitterUrl: true,
      resumeUrl: true,
      education: true,
      experience: true,
      projects: true,
      certifications: true,
      customLinks: true,
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
        linkedinUrl: user.linkedinUrl,
        twitterUrl: user.twitterUrl,
        resumeUrl: user.resumeUrl,
        education: user.education ?? [],
        experience: user.experience ?? [],
        projects: user.projects ?? [],
        certifications: user.certifications ?? [],
        customLinks: user.customLinks ?? [],
      }}
    />
  );
}
