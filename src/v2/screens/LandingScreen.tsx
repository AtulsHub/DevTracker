import Link from "next/link";
import { Syne, DM_Sans } from "next/font/google";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LINKABLE_PLATFORMS, PLATFORMS } from "@/v2/design/platforms";
import type { ContestDto } from "@/v2/lib/api";
import { MARKETING_NAV, SITE_SOCIAL } from "@/v2/lib/site";

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
}: {
  contests: ContestDto[];
  featured: Featured[];
}) {
  const next = contests[0];
  const people = featured.slice(0, 5);

  return (
    <div className={`${syne.variable} ${dmSans.variable} landing`}>
      {/* ── Hero: one composition ── */}
      <section className="landing-hero relative min-h-[calc(100dvh-var(--v2-topbar-h))] overflow-hidden">
        <HeatPlane />
        <div className="landing-scan pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-[color-mix(in_srgb,var(--land-accent)_30%,transparent)] to-transparent" />

        <div className="relative z-[2] mx-auto flex min-h-[calc(100dvh-var(--v2-topbar-h))] w-full max-w-[var(--v2-content-max)] flex-col justify-end px-5 pb-12 pt-16 sm:px-8 sm:pb-16 lg:pb-20">
          <p
            className="landing-rise landing-display text-[clamp(3.5rem,14vw,9.5rem)] font-bold leading-[0.85] tracking-[-0.04em] text-[var(--land-fg)]"
            aria-label="DevTrack"
          >
            DevTrack
          </p>
          <h1 className="landing-rise landing-rise-delay-1 mt-6 max-w-xl landing-display text-[clamp(1.35rem,3.2vw,2.15rem)] font-semibold leading-[1.15] tracking-tight text-[var(--land-fg)]">
            Your contest life, finally in one pulse.
          </h1>
          <p className="landing-rise landing-rise-delay-2 mt-3 max-w-md text-[1.05rem] leading-relaxed text-[var(--land-muted)]">
            Ratings, streaks, and calendars from five platforms — synced into a
            workspace built for people who actually grind.
          </p>
          <div className="landing-rise landing-rise-delay-3 mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/sign-up"
              className="landing-cta inline-flex min-h-12 items-center gap-2 px-6 text-[0.95rem] font-semibold no-underline transition-transform duration-200 hover:-translate-y-0.5"
            >
              Start free
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
              href="/sign-up"
              className="landing-cta inline-flex min-h-12 items-center gap-2 px-6 text-[0.95rem] font-semibold no-underline transition-transform duration-200 hover:-translate-y-0.5"
            >
              Create account
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

      <footer className="border-t border-[var(--land-line)] bg-[var(--land-bg)] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[var(--v2-content-max)] flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="landing-display text-lg font-semibold text-[var(--land-fg)]">
              DevTrack
            </p>
            <p className="mt-2 max-w-xs text-[var(--v2-text-sm)] text-[var(--land-muted)]">
              Built for competitive programmers who want one pulse across every
              platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--land-muted)]">
                Product
              </p>
              <ul className="mt-3 space-y-2 text-[var(--v2-text-sm)]">
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
                      className="text-[var(--land-fg)] no-underline hover:text-[var(--land-accent)]"
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
              <ul className="mt-3 space-y-2 text-[var(--v2-text-sm)]">
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
                    className="text-[var(--land-fg)] no-underline hover:text-[var(--land-accent)]"
                  >
                    Sign up
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-[var(--land-fg)] no-underline hover:text-[var(--land-accent)]"
                  >
                    Open app
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--land-muted)]">
                Contact us
              </p>
              <ul className="mt-3 space-y-2 text-[var(--v2-text-sm)]">
                {SITE_SOCIAL.map((s) => {
                  const external = !s.href.startsWith("mailto:");
                  return (
                    <li key={s.id}>
                      <a
                        href={s.href}
                        {...(external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="text-[var(--land-fg)] no-underline hover:text-[var(--land-accent)]"
                      >
                        {s.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-[var(--v2-content-max)] font-mono text-[11px] text-[var(--land-muted)]">
          © {new Date().getFullYear()} DevTrack · built for competitive
          programmers
        </p>
      </footer>
    </div>
  );
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
