/**
 * src/middleware.ts
 * Next.js middleware for authentication protection.
 * Protects all routes under /(app)/* — redirects to sign-in if not authenticated.
 */
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protected app routes
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/contests") ||
    pathname.startsWith("/teams") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  if (isAppRoute && !req.auth) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files, API routes, and auth pages
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up).*)",
  ],
};
