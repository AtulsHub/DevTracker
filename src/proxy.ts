/**
 * Auth gate — protect private app routes; guests keep Home/Contests/Explore/Teams/u/*.
 * Also enforces maintenance mode for non-admins.
 */
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";
import { getMaintenanceConfig } from "@/server/services/site-config";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  const protectedPrefixes = [
    "/dashboard",
    "/home",
    "/settings",
    "/profile",
    "/onboarding",
    "/admin",
  ];

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    const dest =
      pathname.startsWith("/profile") || pathname.startsWith("/dashboard")
        ? "/sign-up"
        : "/sign-in";
    const url = new URL(dest, req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const maintenanceBypass =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/maintenance");

  if (!maintenanceBypass) {
    try {
      const maintenance = await getMaintenanceConfig();
      if (maintenance.enabled) {
        const isAdmin = Boolean(
          (req.auth?.user as { isAdmin?: boolean } | undefined)?.isAdmin,
        );
        if (!isAdmin) {
          return NextResponse.redirect(new URL("/maintenance", req.url));
        }
      }
    } catch {
      // Don't block the whole site if settings table is missing mid-deploy.
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
