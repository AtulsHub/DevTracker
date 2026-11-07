import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { DashboardScreen } from "@/v2/screens/DashboardScreen";
import { loadDashboardData } from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "Overview",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/dashboard");

  const data = await loadDashboardData(session.user.id);

  const overviewTargets = data.overviewTargets.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    type: t.type,
    teamId: t.teamId,
    criteria: t.criteria,
    startsAt: t.startsAt
      ? t.startsAt instanceof Date
        ? t.startsAt.toISOString()
        : String(t.startsAt)
      : null,
    endsAt: t.endsAt
      ? t.endsAt instanceof Date
        ? t.endsAt.toISOString()
        : String(t.endsAt)
      : null,
    progress: t.progress
      ? {
          currentValue: t.progress.currentValue,
          goalValue: t.progress.goalValue,
          isCompleted: t.progress.isCompleted,
        }
      : null,
    teamName: t.teamName ?? null,
    teamSlug: t.teamSlug ?? null,
    source: t.source,
  }));

  return (
    <DashboardScreen
      totalSolved={data.totalSolved}
      streak={data.streak}
      todaySolved={data.todaySolved}
      platforms={data.platforms}
      recent={data.recent.map((r) => ({
        ...r,
        verdict: r.verdict ?? "OK",
        submittedAt:
          r.submittedAt instanceof Date
            ? r.submittedAt.toISOString()
            : String(r.submittedAt),
      }))}
      acceptedSolves={data.acceptedSolves.map((s) => ({
        id: s.id,
        platform: s.platform,
        title: s.title,
        url: s.url,
        rating: s.rating,
        solvedAt:
          s.solvedAt instanceof Date
            ? s.solvedAt.toISOString()
            : String(s.solvedAt),
      }))}
      overviewTargets={overviewTargets}
      heatmap={data.heatmap}
      heatmapByPlatform={data.heatmapByPlatform}
      heatmapAllTime={data.heatmapAllTime}
      heatmapAllTimeByPlatform={data.heatmapAllTimeByPlatform}
      heatmapPlatforms={data.heatmapPlatforms}
      heatmapActiveYears={data.heatmapActiveYears}
    />
  );
}
