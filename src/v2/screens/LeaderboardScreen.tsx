import { LeaderboardBoard } from "@/v2/components/LeaderboardBoard";
import { PageHeader } from "@/v2/components/PageHeader";
import type { LeaderboardPerson } from "@/v2/lib/queries";

export function LeaderboardScreen({
  people,
}: {
  people: LeaderboardPerson[];
}) {
  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader title="Leaderboard" />
      <LeaderboardBoard people={people} />
    </div>
  );
}
