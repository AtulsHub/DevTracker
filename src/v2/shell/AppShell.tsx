"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ThemeProvider } from "./ThemeProvider";
import { GuestShell } from "./GuestShell";

export function AppShell({
  children,
  signedIn,
  userName,
  userEmail,
  userImage,
}: {
  children: React.ReactNode;
  signedIn: boolean;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}) {
  const pathname = usePathname();
  // Marketing pages use GuestShell (Home / socials / profile) even when signed in.
  const showMarketingChrome =
    !signedIn || pathname === "/" || pathname === "/landing";

  if (showMarketingChrome) {
    return (
      <GuestShell
        signedIn={signedIn}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      >
        {children}
      </GuestShell>
    );
  }

  return (
    <ThemeProvider>
      <div
        className="flex min-h-dvh text-[var(--v2-fg)]"
        style={{
          backgroundColor: "var(--v2-bg)",
          backgroundImage: "var(--v2-bg-glow)",
          backgroundAttachment: "fixed",
        }}
      >
        <Sidebar
          signedIn
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
        />
        <div className="flex min-w-0 flex-1 flex-col bg-transparent">
          <TopBar signedIn />
          <main className="flex-1 overflow-x-hidden bg-transparent pb-[calc(var(--v2-bottom-nav-h)+env(safe-area-inset-bottom)+0.75rem)] md:pb-8">
            {children}
          </main>
        </div>
        <BottomNav
          signedIn
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
        />
      </div>
    </ThemeProvider>
  );
}
