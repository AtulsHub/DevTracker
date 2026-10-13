/**
 * Route group layout — chrome lives in root AppShell (v2).
 * Auth for private routes is enforced in src/proxy.ts.
 */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
