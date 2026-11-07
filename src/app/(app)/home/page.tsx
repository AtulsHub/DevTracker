import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { HomeScreen } from "@/v2/screens/HomeScreen";
import {
  loadDashboardData,
  loadFeaturedUsers,
  loadUpcomingContests,
} from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "Home",
};

export const dynamic = "force-dynamic";

export default async function HomeFeedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/home");
  }

  const [contests, featured, dash] = await Promise.all([
    loadUpcomingContests(21),
    loadFeaturedUsers(8),
    loadDashboardData(session.user.id),
  ]);

  const serialized = contests.map((c) => ({
    ...c,
    startsAt:
      c.startsAt instanceof Date ? c.startsAt.toISOString() : String(c.startsAt),
  }));

  const continuePlatform =
    [...dash.platforms]
      .sort((a, b) => {
        const at = a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : 0;
        const bt = b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : 0;
        return bt - at;
      })
      .map((p) => ({
        platform: p.platform,
        handle: p.handle,
        lastSyncedAt: p.lastSyncedAt
          ? p.lastSyncedAt instanceof Date
            ? p.lastSyncedAt.toISOString()
            : String(p.lastSyncedAt)
          : null,
        syncError: p.syncError,
      }))[0] ?? null;

  const activeTarget =
    dash.overviewTargets.find((t) => t.progress && !t.progress.isCompleted) ??
    null;

  return (
    <HomeScreen
      username={session.user.name ?? session.user.email}
      contests={serialized}
      today={{
        todaySolved: dash.todaySolved,
        streak: dash.streak,
        totalSolved: dash.totalSolved,
      }}
      continuePlatform={continuePlatform}
      needsLink={dash.platforms.length === 0}
      featured={featured}
      activeTarget={
        activeTarget
          ? {
              title: activeTarget.title,
              current: activeTarget.progress!.currentValue,
              goal: activeTarget.progress!.goalValue,
              source: activeTarget.source ?? "personal",
              teamName: activeTarget.teamName ?? null,
            }
          : null
      }
    />
  );
}
