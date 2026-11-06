import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { SubmissionsScreen } from "@/v2/screens/SubmissionsScreen";
import { getAllSubmissions } from "@/v2/lib/queries";

export const metadata: Metadata = {
  title: "Submissions",
};

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/dashboard/submissions");
  }

  const rows = await getAllSubmissions(session.user.id, 500);

  return (
    <SubmissionsScreen
      submissions={rows.map((r) => ({
        id: r.id,
        platform: r.platform,
        title: r.title,
        url: r.url,
        rating: r.rating,
        verdict: r.verdict,
        submittedAt:
          r.submittedAt instanceof Date
            ? r.submittedAt.toISOString()
            : String(r.submittedAt),
      }))}
    />
  );
}
