import Link from "next/link";
import { Syne, DM_Sans } from "next/font/google";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LINKABLE_PLATFORMS, PLATFORMS } from "@/v2/design/platforms";
import type { ContestDto } from "@/v2/lib/api";
import { MARKETING_NAV, SITE_SOCIAL } from "@/v2/lib/site";
import { BrandLogo } from "@/v2/components/Brand";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-landing-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-landing-body",
  display: "swap",
});

type Featured = {
  username: string;
  displayName: string | null;
  totalSolved?: number;
  platforms?: string[];
  headline?: string | null;
};

export function LandingScreen({
  contests,
  featured,
  signedIn = false,
}: {
  contests: ContestDto[];
  featured: Featured[];
  signedIn?: boolean;
}) {
  const next = contests[0];
  const people = featured.slice(0, 5);

  return (
    <div className={`${syne.variable} ${dmSans.variable} landing`}>
      {/* ── Hero: one composition ── */}
      <section className="landing-hero relative min-h-[min(78dvh,36rem)] overflow-hidden sm:min-h-[calc(100dvh-var(--v2-topbar-h))]">
        <HeatPlane />
        <div className="landing-scan pointer-events-none absolute inset-x-0 top-0 z-[1] h-20 bg-gradient-to-b from-[color-mix(in_srgb,var(--land-accent)_30%,transparent)] to-transparent sm:h-24" />

        <div className="relative z-[2] mx-auto flex min-h-[min(78dvh,36rem)] w-full max-w-[var(--v2-content-max)] flex-col justify-end px-5 pb-10 pt-10 sm:min-h-[calc(100dvh-var(--v2-topbar-h))] sm:px-8 sm:pb-16 sm:pt-16 lg:pb-20">
          <div className="landing-rise" aria-label="DevTrack">
            <BrandLogo
              height={68}
              priority
              className="max-w-[min(100%,20rem)] sm:hidden"
            />
            <BrandLogo
              height={108}
              priority
              className="hidden max-w-[min(100%,34rem)] sm:inline-flex"
            />
          </div>
          <h1 className="landing-rise landing-rise-delay-1 mt-5 max-w-xl landing-display text-[clamp(1.3rem,3.2vw,2.15rem)] font-semibold leading-[1.15] tracking-tight text-[var(--land-fg)] sm:mt-6">
            Your contest life, finally in one pulse.
          </h1>
          <p className="landing-rise landing-rise-delay-2 mt-3 max-w-md text-[1rem] leading-relaxed text-[var(--land-muted)] sm:text-[1.05rem]">
            Ratings, streaks, and calendars from Codeforces, LeetCode, AtCoder,
            and CodeChef — synced into a workspace built for people who grind.
          </p>
          <div className="landing-rise landing-rise-delay-3 mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
            <Link
              href={signedIn ? "/dashboard" : "/sign-up"}
              className="landing-cta inline-flex min-h-12 items-center gap-2 px-6 text-[0.95rem] font-semibold no-underline transition-transform duration-200 hover:-translate-y-0.5"
            >
              {signedIn ? "Open overview" : "Start free"}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/contests"
              className="inline-flex min-h-12 items-center gap-2 border border-[var(--land-line)] bg-transparent px-6 text-[0.95rem] font-semibold text-[var(--land-fg)] no-underline transition-colors hover:border-[var(--land-fg)] hover:bg-[var(--land-fg)] hover:text-[var(--land-bg)]"
            >
              See contests
            </Link>
          </div>
        </div>
      </section>

      {/* ── Platforms: one job ── */}
      <section className="border-y border-[var(--land-line)] bg-[var(--land-band)] text-[var(--land-band-fg)]">
        <div className="overflow-hidden py-5">
          <div className="landing-marquee-track gap-10 px-6">
            {[...LINKABLE_PLATFORMS, ...LINKABLE_PLATFORMS].map((id, i) => (
              <span
                key={`${id}-${i}`}
                className="landing-display text-2xl font-semibold tracking-tight text-[var(--land-accent)] sm:text-3xl"
              >
                {PLATFORMS[id].label}
                <span className="mx-10 text-[var(--land-band-fg)]/25">/</span>
              </span>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-[var(--v2-content-max)] px-5 pb-14 pt-6 sm:px-8">
          <h2 className="max-w-2xl landing-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-tight">
            Stop tab-hopping. Watch every platform breathe together.
          </h2>
          <p className="mt-4 max-w-lg text-[1rem] leading-relaxed text-[var(--land-band-muted)]">
            Link once. DevTrack keeps solves, ratings, and contest days
            aligned — so you train the graph, not the browser tabs.
          </p>
        </div>
      </section>

      {/* ── Next contest: one dramatic focus ── */}
      <section className="mx-auto w-full max-w-[var(--v2-content-max)] px-5 py-16 sm:px-8 sm:py-24">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--land-muted)]">
          On the clock
        </p>
        <h2 className="mt-3 max-w-xl landing-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-tight text-[var(--land-fg)]">
          The next fight is already on your calendar.
        </h2>
        {next ? (
          <Link
            href="/contests"
            className="group mt-10 block no-underline outline-none"
          >
            <div className="relative overflow-hidden border border-[var(--land-line)] bg-[var(--land-bg-alt)] text-[var(--land-fg)] transition-colors duration-200 group-hover:border-transparent group-hover:bg-[var(--land-band)] group-hover:text-[var(--land-band-fg)]">
              <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-10">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--land-muted)] group-hover:text-[var(--land-accent)]">
                    {PLATFORMS[next.platform as keyof typeof PLATFORMS]
                      ?.label ?? next.platform}
                  </p>
                  <p className="mt-3 landing-display text-[clamp(1.5rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-tight">
                    {next.name}
                  </p>
                  <p className="mt-3 font-mono text-sm text-[var(--land-muted)] group-hover:text-[var(--land-band-muted)]">
                    {new Date(next.startsAt).toLocaleString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 self-start text-sm font-semibold sm:self-end">
                  Full calendar
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
              <div
                className="h-1.5 w-full"
                style={{
                  background: `linear-gradient(90deg, ${
                    PLATFORMS[next.platform as keyof typeof PLATFORMS]
                      ?.colorVar ?? "var(--land-accent)"
                  }, transparent)`,
                }}
                aria-hidden
              />
            </div>
          </Link>
        ) : (
          <p className="mt-8 text-[var(--land-muted)]">
            Contest feed is warming up — check back in a moment.
          </p>
        )}
      </section>

      {/* ── People ── */}
      <section className="border-t border-[var(--land-line)] bg-[var(--land-bg-alt)]">
        <div className="mx-auto max-w-[var(--v2-content-max)] px-5 py-16 sm:px-8 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--land-muted)]">
                In the arena
              </p>
              <h2 className="mt-3 max-w-md landing-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-tight text-[var(--land-fg)]">
                Builders already on the board.
              </h2>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--land-fg)] no-underline underline-offset-4 hover:underline"
            >
              Explore everyone
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          {people.length === 0 ? (
            <p className="mt-10 max-w-md text-[var(--land-muted)]">
              Be first on the public board — create an account and open your
              profile.
            </p>
          ) : (
            <ul className="mt-12 divide-y divide-[var(--land-line)] border-y border-[var(--land-line)]">
              {people.map((u, i) => (
                <li key={u.username}>
                  <Link
                    href={`/u/${u.username}`}
                    className="group flex flex-wrap items-center justify-between gap-4 py-5 no-underline transition-colors hover:bg-[var(--land-bg)]/70 sm:py-6"
                  >
                    <div className="flex min-w-0 items-baseline gap-4 sm:gap-8">
                      <span className="font-mono text-xs text-[var(--land-muted)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate landing-display text-xl font-semibold tracking-tight text-[var(--land-fg)] sm:text-2xl">
                          {u.displayName ?? u.username}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-[var(--land-muted)]">
                          @{u.username}
                          {u.headline ? ` · ${u.headline}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-10 sm:pl-0">
                      <span className="font-mono text-sm tabular-nums text-[var(--land-fg)]">
                        {(u.totalSolved ?? 0).toLocaleString()}
                        <span className="ml-1.5 text-[var(--land-muted)]">
                          solved
                        </span>
                      </span>
                      <ArrowUpRight className="size-4 text-[var(--land-muted)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--land-fg)]" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Close CTA ── */}
      <section className="relative overflow-hidden bg-[var(--land-band)] text-[var(--land-band-fg)]">
        <div
          className="pointer-events-none absolute -right-20 top-0 size-[28rem] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--land-accent) 55%, transparent), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-[var(--v2-content-max)] px-5 py-20 sm:px-8 sm:py-28">
          <p className="landing-display text-[clamp(2.25rem,7vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.03em]">
            Link once.
            <br />
            <span className="text-[var(--land-accent)]">Track everywhere.</span>
          </p>
          <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-[var(--land-band-muted)]">
            Free for personal grinding. Teams, streaks, and a live contest
            calendar come with you.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={signedIn ? "/dashboard" : "/sign-up"}
              className="landing-cta inline-flex min-h-12 items-center gap-2 px-6 text-[0.95rem] font-semibold no-underline transition-transform duration-200 hover:-translate-y-0.5"
            >
              {signedIn ? "Open overview" : "Create account"}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/teams"
              className="inline-flex min-h-12 items-center border border-[var(--land-band-fg)]/25 px-6 text-[0.95rem] font-semibold text-[var(--land-band-fg)] no-underline transition-colors hover:border-[var(--land-band-fg)] hover:bg-[var(--land-band-fg)] hover:text-[var(--land-band)]"
            >
              Browse teams
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--land-line)] bg-[var(--land-bg)]">
        {/* Contact band — the mobile-first visual anchor */}
        <div className="border-b border-[var(--land-line)] bg-[var(--land-bg-alt)] px-5 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto flex max-w-[var(--v2-content-max)] flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--land-muted)]">
                Say hello
              </p>
              <p className="mt-2 landing-display text-[clamp(1.35rem,3.5vw,1.85rem)] font-semibold tracking-tight text-[var(--land-fg)]">
                Reach the person building DevTrack.
              </p>
            </div>
            <ul className="grid grid-cols-4 gap-2 sm:flex sm:gap-2.5">
              {SITE_SOCIAL.map((s) => {
                const external = !s.href.startsWith("mailto:");
                return (
                  <li key={s.id} className="min-w-0">
                    <a
                      href={s.href}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      aria-label={s.label}
                      title={s.label}
                      className="group flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-[var(--v2-radius-md)] border border-[var(--land-line)] bg-[var(--land-bg)] px-2 text-[var(--land-fg)] no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--land-accent)] hover:text-[var(--land-accent)] sm:min-h-12 sm:min-w-[4.75rem] sm:flex-row sm:gap-2 sm:px-3.5"
                    >
                      <SocialGlyph id={s.id} className="size-[1.15rem] shrink-0" />
                      <span className="truncate text-[10px] font-semibold tracking-wide sm:text-[var(--v2-text-xs)]">
                        {s.label}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-[var(--v2-content-max)]">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
              <div className="max-w-sm">
                <BrandLogo height={30} className="max-w-[10.5rem]" />
                <p className="mt-3 text-[var(--v2-text-sm)] leading-relaxed text-[var(--land-muted)]">
                  One pulse across contests, ratings, and teams — built for
                  people who grind.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 sm:gap-14">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--land-muted)]">
                    Product
                  </p>
                  <ul className="mt-3 space-y-2.5 text-[var(--v2-text-sm)]">
                    {[
                      { href: "/", label: "Home" },
                      ...MARKETING_NAV.map((l) => ({
                        href: l.href,
                        label: l.label,
                      })),
                    ].map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="inline-flex items-center gap-1 text-[var(--land-fg)] no-underline transition-colors hover:text-[var(--land-accent)]"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--land-muted)]">
                    Account
                  </p>
                  <ul className="mt-3 space-y-2.5 text-[var(--v2-text-sm)]">
                    {signedIn ? (
                      <li>
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-1 text-[var(--land-fg)] no-underline hover:text-[var(--land-accent)]"
                        >
                          Open app
                          <ArrowUpRight className="size-3.5 opacity-50" aria-hidden />
                        </Link>
                      </li>
                    ) : (
                      <>
                        <li>
                          <Link
                            href="/sign-in"
                            className="text-[var(--land-fg)] no-underline hover:text-[var(--land-accent)]"
                          >
                            Sign in
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/sign-up"
                            className="inline-flex items-center gap-1 font-semibold text-[var(--land-accent)] no-underline hover:underline"
                          >
                            Sign up
                            <ArrowUpRight className="size-3.5" aria-hidden />
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-[var(--land-line)] pt-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[11px] text-[var(--land-muted)]">
                © {new Date().getFullYear()} DevTrack
              </p>
              <p className="text-[11px] text-[var(--land-muted)]">
                Built for competitive programmers
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SocialGlyph({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  if (id === "github") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    );
  }
  if (id === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  if (id === "discord") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    );
  }
  if (id === "email") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }
  return null;
}

/** Full-bleed activity plane — the hero’s visual anchor */
function HeatPlane() {
  const cells = 84;
  const pattern = [
    0, 1, 0, 2, 3, 1, 0, 4, 2, 0, 1, 3, 0, 2, 4, 1, 0, 0, 3, 2, 1, 0, 4, 0, 2,
    3, 1, 0, 0, 2, 4, 1, 3, 0, 1, 2, 0, 4, 3, 1, 0, 2, 0, 1, 3, 4, 0, 2, 1, 0,
    3, 0, 4, 2, 1, 0, 0, 3, 1, 2, 4, 0, 1, 0, 2, 3, 0, 1, 4, 2, 0, 3, 1, 0, 2,
    0, 4, 1, 3, 0, 2, 1, 0, 3,
  ];

  return (
    <div
      className="absolute inset-0 z-0"
      aria-hidden
      style={{
        background:
          "radial-gradient(120% 80% at 70% 20%, color-mix(in srgb, var(--land-accent) 16%, transparent), transparent 55%), linear-gradient(165deg, var(--land-bg) 0%, var(--land-bg-alt) 55%, color-mix(in srgb, var(--land-fg) 6%, var(--land-bg)) 100%)",
      }}
    >
      <div className="absolute inset-y-0 right-0 grid w-full grid-cols-7 gap-1.5 p-4 opacity-90 sm:w-[58%] sm:grid-cols-12 sm:gap-2 sm:p-8 lg:w-[52%]">
        {Array.from({ length: cells }, (_, i) => {
          const level = pattern[i % pattern.length] ?? 0;
          const delay = (i % 17) * 0.18;
          const opacity =
            level === 0
              ? 0.08
              : level === 1
                ? 0.22
                : level === 2
                  ? 0.4
                  : level === 3
                    ? 0.62
                    : 0.92;
          return (
            <div
              key={i}
              className="landing-heat-cell aspect-square rounded-[3px]"
              style={{
                background:
                  level === 0
                    ? "color-mix(in srgb, var(--land-fg) 8%, transparent)"
                    : `color-mix(in srgb, var(--land-heat) ${Math.round(opacity * 100)}%, color-mix(in srgb, var(--land-fg) 10%, transparent))`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--land-bg)] via-[color-mix(in_srgb,var(--land-bg)_75%,transparent)] to-transparent sm:via-[color-mix(in_srgb,var(--land-bg)_45%,transparent)]" />
    </div>
  );
}
