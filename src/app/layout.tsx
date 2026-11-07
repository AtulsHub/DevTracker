import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/server/auth";
import { AppShell } from "@/v2/shell/AppShell";
import { FeedbackProviders } from "@/v2/feedback/FeedbackProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DevTrack",
    template: "%s · DevTrack",
  },
  description:
    "Track DSA progress across Codeforces, LeetCode, HackerRank, AtCoder, and CodeChef. Contests, teams, and public profiles.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DevTrack",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8eef6" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const signedIn = !!session?.user?.id;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('v2-theme')||'system';var d=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FeedbackProviders>
          <AppShell
            signedIn={signedIn}
            userName={session?.user?.name}
            userEmail={session?.user?.email}
            userImage={session?.user?.image}
          >
            {children}
          </AppShell>
        </FeedbackProviders>
      </body>
    </html>
  );
}
