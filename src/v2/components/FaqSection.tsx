import { ArrowUpRight, ChevronDown } from "lucide-react";
import { SITE_SOCIAL } from "@/v2/lib/site";

export const FAQ_ITEMS = [
  {
    question: "What is a LeetCode ID?",
    answer:
      "It is your LeetCode username, not your email address or account number. Open your LeetCode profile and use the username shown in the profile URL, for example leetcode.com/u/your-username.",
  },
  {
    question: "How do I find my username on other platforms?",
    answer:
      "Use the public username or handle you use on each platform: your Codeforces handle, LeetCode username, AtCoder username, or CodeChef username. You can usually find it in the profile page URL or beside your avatar.",
  },
  {
    question: "How do I connect a platform account?",
    answer:
      "Create or sign in to your DevTrack account, open Settings, and add the username for the platform you want to connect. Make sure the spelling is exact and your platform profile is public.",
  },
  {
    question: "How often does DevTrack update my progress?",
    answer:
      "DevTrack regularly syncs public submissions and contest data from connected platforms. A new submission or contest result may take a short time to appear.",
  },
  {
    question: "Can I use DevTrack for a team?",
    answer:
      "Yes. Create or join a team to compare progress, use team leaderboards, and view targets set by team admins. Your team and profile privacy controls decide who can see your activity.",
  },
  {
    question: "Is my coding activity public?",
    answer:
      "Your profile privacy settings and team visibility determine who can see your activity. Teammates and followers may have access based on the settings you choose.",
  },
  {
    question: "What platforms are supported?",
    answer:
      "The current version supports tracking for Codeforces, LeetCode, AtCoder, and CodeChef.",
  },
  {
    question: "Why is a problem or contest missing?",
    answer:
      "Check that the username is correct, the platform profile is public, and the data sync has finished. Platform APIs can also take time to publish a new submission or contest result.",
  },
];

export function FaqSection({
  limit,
  variant = "landing",
}: {
  limit?: number;
  variant?: "landing" | "page";
}) {
  const items = typeof limit === "number" ? FAQ_ITEMS.slice(0, limit) : FAQ_ITEMS;
  const email = SITE_SOCIAL.find((social) => social.id === "email");
  const linkedin = SITE_SOCIAL.find((social) => social.id === "linkedin");
  const page = variant === "page";

  return (
    <div className="mx-auto max-w-[var(--v2-content-max)] px-5 py-16 sm:px-8 sm:py-24">
      <div className={page ? "grid gap-10 lg:grid-cols-[0.7fr_1.3fr]" : ""}>
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--land-muted)]">
            Help center
          </p>
          <h2 className="mt-3 max-w-xl landing-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-tight text-[var(--land-fg)]">
            Questions before you start?
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-[var(--land-muted)]">
            Find your platform username, connect an account, and understand
            how DevTrack syncs your progress.
          </p>
        </div>

        <div className={page ? "mt-1" : "mt-10"}>
          <div className="border-t border-[var(--land-line)]">
            {items.map((item) => (
              <details
                key={item.question}
                className="group border-b border-[var(--land-line)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-[1.05rem] font-semibold text-[var(--land-fg)] marker:hidden sm:py-6">
                  <span>{item.question}</span>
                  <ChevronDown
                    className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="max-w-2xl pb-6 pr-8 leading-relaxed text-[var(--land-muted)]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 border border-[var(--land-line)] bg-[var(--land-bg-alt)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="font-semibold text-[var(--land-fg)]">
                Still have a question?
              </p>
              <p className="mt-1 text-sm text-[var(--land-muted)]">
                Feedback and help requests are always welcome.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {email ? (
                <a
                  href={email.href}
                  className="landing-cta inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold no-underline"
                >
                  Email
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              ) : null}
              {linkedin ? (
                <a
                  href={linkedin.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 border border-[var(--land-line)] px-4 text-sm font-semibold text-[var(--land-fg)] no-underline hover:border-[var(--land-fg)]"
                >
                  LinkedIn
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
