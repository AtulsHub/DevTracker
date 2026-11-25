import type { Metadata } from "next";
import { FaqSection } from "@/v2/components/FaqSection";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about DevTrack usernames, platform accounts, syncing, teams, and privacy.",
};

export default function FaqPage() {
  return (
    <main className="landing min-h-[calc(100dvh-var(--v2-topbar-h))]">
      <FaqSection variant="page" />
    </main>
  );
}
