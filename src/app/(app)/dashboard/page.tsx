import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { DashboardScreen } from "@/v2/screens/DashboardScreen";
import { loadDashboardData } from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/dashboard");

  const data = await loadDashboardData(session.user.id);

  return (
    <DashboardScreen
      totalSolved={data.totalSolved}
      streak={data.streak}
      todaySolved={data.todaySolved}
      platforms={data.platforms}
      recent={data.recent.map((r) => ({
        ...r,
        submittedAt:
          r.submittedAt instanceof Date
            ? r.submittedAt.toISOString()
            : String(r.submittedAt),
      }))}
      heatmap={data.heatmap}
    />
  );
}
