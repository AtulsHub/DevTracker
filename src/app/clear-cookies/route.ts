import { NextResponse } from "next/server";

/**
 * Clears Auth.js / NextAuth cookies that can bloat past Node's header limit (HTTP 431).
 * Visit http://localhost:3000/clear-cookies once, then go home.
 */
const NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Secure-authjs.csrf-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.csrf-token",
  "__Secure-next-auth.csrf-token",
];

export async function GET() {
  const res = NextResponse.redirect(new URL("/", process.env.AUTH_URL ?? "http://localhost:3000"));

  for (const name of NAMES) {
    res.cookies.set(name, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
    // Chunked JWT cookies: name.0, name.1, ...
    for (let i = 0; i < 10; i++) {
      res.cookies.set(`${name}.${i}`, "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
        sameSite: "lax",
      });
    }
  }

  return res;
}
