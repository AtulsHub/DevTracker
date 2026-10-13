import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ThemeProvider } from "./ThemeProvider";
import { GuestShell } from "./GuestShell";

export function AppShell({
  children,
  signedIn,
  userName,
}: {
  children: React.ReactNode;
  signedIn: boolean;
  userName?: string | null;
}) {
  // Guests get a light marketing chrome — no app sidebar / profile rail.
  if (!signedIn) {
    return <GuestShell>{children}</GuestShell>;
  }

  return (
    <ThemeProvider>
      <div className="flex min-h-dvh bg-[var(--v2-bg)] text-[var(--v2-fg)]">
        <Sidebar signedIn userName={userName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar signedIn />
          <main className="flex-1 overflow-x-hidden pb-[calc(var(--v2-bottom-nav-h)+env(safe-area-inset-bottom)+0.75rem)] md:pb-6">
            {children}
          </main>
        </div>
        <BottomNav signedIn />
      </div>
    </ThemeProvider>
  );
}
