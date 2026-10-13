import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { OnboardingScreen } from "@/v2/screens/OnboardingScreen";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/onboarding");

  const profile = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { displayName: true },
  });

  return (
    <OnboardingScreen
      initialName={profile?.displayName ?? session.user.name ?? ""}
    />
  );
}
