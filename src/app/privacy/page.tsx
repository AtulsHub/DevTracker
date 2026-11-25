import type { Metadata } from "next";
import { SITE_SOCIAL } from "@/v2/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What DevTrack collects and how account and activity data is used.",
};

const email = SITE_SOCIAL.find((social) => social.id === "email");

export default function PrivacyPage() {
  return (
    <main className="landing min-h-[calc(100dvh-var(--v2-topbar-h))] px-5 py-12 sm:px-8 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--land-muted)]">
          DevTrack V1
        </p>
        <h1 className="landing-display mt-3 text-4xl font-semibold tracking-tight text-[var(--land-fg)] sm:text-5xl">
          Privacy &amp; data use
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--land-muted)]">
          This page describes the information DevTrack uses to provide its
          current features.
        </p>

        <div className="mt-10 space-y-8 border-t border-[var(--land-line)] pt-8 text-sm leading-7 text-[var(--land-muted)]">
          <section>
            <h2 className="text-lg font-semibold text-[var(--land-fg)]">
              Information you provide
            </h2>
            <p className="mt-2">
              DevTrack uses account details and profile information you provide,
              including usernames for coding platforms you choose to link.
              Linked account activity and statistics are synced to show your
              progress in the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--land-fg)]">
              How information is used
            </h2>
            <p className="mt-2">
              Account and synced activity data power your progress dashboard,
              contest views, team features, and public profiles. Profile
              visibility and discoverability depend on the settings available
              in your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--land-fg)]">
              Service providers
            </h2>
            <p className="mt-2">
              DevTrack is hosted on Vercel and stores application data using
              Neon. Vercel Analytics is used for site analytics. Resend may
              process account emails, and Cloudinary may process profile images
              when those features are used. Coding platforms have their own
              privacy practices for information they provide.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--land-fg)]">
              Your choices and questions
            </h2>
            <p className="mt-2">
              You can review your profile visibility and linked accounts in the
              app. This first version does not provide self-service account
              deletion or data export. For privacy questions or data requests,
              contact{" "}
              {email ? (
                <a
                  href={email.href}
                  className="text-[var(--land-fg)] underline underline-offset-4 hover:text-[var(--land-accent)]"
                >
                  {email.href.replace(/^mailto:/, "")}
                </a>
              ) : (
                "the DevTrack team"
              )}
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
