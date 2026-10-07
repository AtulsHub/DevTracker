import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DevTrack — Track Your Competitive Programming Progress",
  description:
    "One dashboard for all your competitive programming accounts. Track Codeforces, LeetCode, AtCoder, CodeChef and more. Build teams, set targets, stay consistent.",
};

const PLATFORMS = [
  { name: "Codeforces", color: "#1976D2", abbr: "CF" },
  { name: "LeetCode", color: "#FFA116", abbr: "LC" },
  { name: "AtCoder", color: "#006FCC", abbr: "AC" },
  { name: "CodeChef", color: "#5B4638", abbr: "CC" },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "Unified Activity Feed",
    desc: "Every solve, every contest, every platform. One timeline, sorted by day.",
  },
  {
    icon: "🔥",
    title: "Streaks & Heatmaps",
    desc: "GitHub-style contribution heatmap across all platforms with streak tracking.",
  },
  {
    icon: "👥",
    title: "Team Dashboards",
    desc: "Create teams for your club or group. Leaderboards, shared targets, announcements.",
  },
  {
    icon: "🎯",
    title: "Smart Targets",
    desc: "Admin-set goals like 'solve 20 rated 1200+ problems by Sunday'. Progress computed automatically.",
  },
  {
    icon: "📅",
    title: "Contest Calendar",
    desc: "Upcoming contests across all platforms in one view. Add reminders, export to calendar.",
  },
  {
    icon: "🔒",
    title: "Granular Privacy",
    desc: "Control exactly who sees your ratings, activity, and handles. Public, followers, team, or private.",
  },
];

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      {/* ── Nav ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "rgba(10,10,15,0.8)",
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "60px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1.1rem",
            color: "var(--accent)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          DevTrack
        </span>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link
            href="/sign-in"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "0.875rem",
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              transition: "color 150ms",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--text-inverse)",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              padding: "7px 18px",
              borderRadius: "var(--radius-sm)",
              transition: "opacity 150ms",
            }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "5rem 2rem 3rem",
          textAlign: "center",
        }}
      >
        <div
          className="badge-accent"
          style={{ display: "inline-block", marginBottom: "1.5rem" }}
        >
          ✦ Open-source competitive programming tracker
        </div>

        <h1
          style={{
            fontSize: "clamp(2.2rem, 6vw, 4rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "1.25rem",
          }}
        >
          All your{" "}
          <span className="gradient-text">competitive programming</span>
          <br />
          data. One dashboard.
        </h1>

        <p
          style={{
            fontSize: "1.125rem",
            color: "var(--text-secondary)",
            maxWidth: "560px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.7,
          }}
        >
          Link your Codeforces, LeetCode, AtCoder and CodeChef handles. See
          everything you solved and every contest you played — per day, per
          platform, in one place.
        </p>

        {/* Platform pills */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "2.5rem",
          }}
        >
          {PLATFORMS.map((p) => (
            <span
              key={p.abbr}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 14px",
                borderRadius: "999px",
                border: "1px solid var(--border-strong)",
                fontSize: "0.8rem",
                fontFamily: "var(--font-mono)",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: p.color,
                  flexShrink: 0,
                }}
              />
              {p.name}
            </span>
          ))}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 14px",
              borderRadius: "999px",
              border: "1px solid var(--border)",
              fontSize: "0.8rem",
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            + more
          </span>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link
            href="/sign-up"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--text-inverse)",
              textDecoration: "none",
              fontWeight: 700,
              padding: "12px 28px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.95rem",
              transition: "opacity 150ms",
            }}
          >
            Start tracking free →
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              textDecoration: "none",
              padding: "12px 28px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.95rem",
              border: "1px solid var(--border-strong)",
              transition: "border-color 150ms",
            }}
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "4rem 2rem",
        }}
      >
        <p className="terminal-header" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          ~/features $
        </p>
        <h2
          style={{
            textAlign: "center",
            fontSize: "1.875rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: "3rem",
          }}
        >
          Built for serious developers
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.title} className="card" style={{ padding: "1.5rem" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>
                {f.icon}
              </div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          maxWidth: "600px",
          margin: "2rem auto 5rem",
          padding: "3rem 2rem",
          textAlign: "center",
          borderRadius: "var(--radius-xl)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="terminal-header" style={{ marginBottom: "0.5rem" }}>
          ~/get-started $
        </p>
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: "0.75rem",
          }}
        >
          Ready to track your grind?
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: "2rem",
            fontSize: "0.9375rem",
          }}
        >
          Free forever for personal use. Teams start with one invite.
        </p>
        <Link
          href="/sign-up"
          style={{
            display: "inline-block",
            backgroundColor: "var(--accent)",
            color: "var(--text-inverse)",
            textDecoration: "none",
            fontWeight: 700,
            padding: "13px 32px",
            borderRadius: "var(--radius-md)",
            fontSize: "1rem",
          }}
        >
          Create free account →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "1.5rem 2rem",
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-mono)",
        }}
      >
        DevTrack © 2026 · Open Source · Built with Next.js + Neon
      </footer>
    </main>
  );
}
