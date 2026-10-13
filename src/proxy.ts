/**
 * Auth gate — protect private app routes; guests keep Home/Contests/Explore/Teams/u/*.
 */
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const protectedPrefixes = [
    "/dashboard",
    "/settings",
    "/profile",
    "/onboarding",
    "/activity",
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

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
