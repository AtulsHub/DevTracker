import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { SettingsScreen } from "@/v2/screens/SettingsScreen";

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
      profileVisibility: true,
      discoverable: true,
      contestRemindersEnabled: true,
    },
  });

  if (!user?.username) redirect("/onboarding");

  return (
    <SettingsScreen
      user={{
        username: user.username,
        profileVisibility: user.profileVisibility,
        discoverable: user.discoverable,
        contestRemindersEnabled: user.contestRemindersEnabled,
      }}
    />
  );
}
