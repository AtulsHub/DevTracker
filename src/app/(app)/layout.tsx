/**
 * src/app/(app)/layout.tsx
 * Protected app shell — sidebar for desktop, bottom nav for mobile.
 * Requires authentication (enforced by middleware).
 */
import Link from "next/link";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "⊞" },
  { href: "/activity", label: "Activity", icon: "⚡" },
  { href: "/contests", label: "Contests", icon: "📅" },
  { href: "/teams", label: "Teams", icon: "👥" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        backgroundColor: "var(--bg-base)",
      }}
    >
      {/* ── Desktop Sidebar ── */}
      <aside
        style={{
          width: "220px",
          flexShrink: 0,
          backgroundColor: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 0",
          position: "sticky",
          top: 0,
          height: "100dvh",
          overflow: "hidden",
        }}
        className="sidebar-desktop"
      >
        {/* Logo */}
        <div style={{ padding: "0 1.25rem 1.5rem" }}>
          <Link
            href="/dashboard"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            DevTrack
          </Link>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 1.25rem",
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontSize: "0.875rem",
                borderRadius: "0",
                transition: "color 150ms, background-color 150ms",
              }}
            >
              <span style={{ fontSize: "1rem", width: "1.25rem", textAlign: "center" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "var(--accent-dim)",
              border: "1px solid var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              color: "var(--accent)",
              flexShrink: 0,
            }}
          >
            {(session.user.name ?? "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {session.user.name ?? "User"}
            </p>
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--text-tertiary)",
                margin: 0,
                fontFamily: "var(--font-mono)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {session.user.email ?? ""}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          overflow: "auto",
          paddingBottom: "80px", // leave room for mobile bottom nav
        }}
      >
        {children}
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="bottom-nav-mobile"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "56px",
          backgroundColor: "var(--bg-surface)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          paddingBottom: "env(safe-area-inset-bottom)",
          zIndex: 40,
        }}
        aria-label="Bottom navigation"
      >
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              padding: "6px 12px",
              minWidth: "44px",
              minHeight: "44px",
              justifyContent: "center",
            }}
            aria-label={item.label}
          >
            <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
            <span style={{ fontSize: "0.625rem", fontFamily: "var(--font-mono)" }}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <style>{`
        /* Show sidebar only on desktop */
        @media (max-width: 1023px) {
          .sidebar-desktop { display: none !important; }
        }
        /* Show bottom nav only on mobile */
        @media (min-width: 1024px) {
          .bottom-nav-mobile { display: none !important; }
          main { padding-bottom: 0 !important; }
        }
      `}</style>
    </div>
  );
}
