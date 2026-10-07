import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DevTrack — Track Your Competitive Programming Progress",
    template: "%s | DevTrack",
  },
  description:
    "One dashboard for all your competitive programming accounts. Track Codeforces, LeetCode, AtCoder and more. Build teams, set targets, and stay consistent.",
  keywords: [
    "competitive programming",
    "DSA tracker",
    "Codeforces",
    "LeetCode",
    "coding progress",
  ],
  authors: [{ name: "DevTrack" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "DevTrack — Track Your Competitive Programming Progress",
    description:
      "One dashboard for all your competitive programming accounts.",
    siteName: "DevTrack",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevTrack",
    description: "Track your competitive programming progress.",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
