/**
 * src/server/auth/index.ts
 * Auth.js (NextAuth v5) configuration.
 * Supports: Credentials (email + password), GitHub OAuth, Google OAuth.
 * Users/accounts are persisted in Neon Postgres via the Drizzle adapter;
 * sessions are JWTs (required for the Credentials provider to work).
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import {
  authUsers,
  authAccounts,
  authSessions,
  authVerificationTokens,
} from "@/server/db/auth-tables";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/** Keep JWTs tiny — never put base64 avatars in session cookies (causes HTTP 431). */
function cookieSafeImage(image: string | null | undefined): string | null {
  if (!image) return null;
  if (image.startsWith("data:")) return null;
  if (image.length > 500) return null;
  return image;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Use the Drizzle adapter to persist users/accounts in Neon Postgres.
  // We pass adapter-facing tables (`auth-tables.ts`) that map onto the app's
  // physical tables/columns with the property names Auth.js expects.
  adapter: DrizzleAdapter(db, {
    usersTable: authUsers,
    accountsTable: authAccounts,
    sessionsTable: authSessions,
    verificationTokensTable: authVerificationTokens,
  }),

  session: {
    // Auth.js always issues a JWT for the Credentials provider (it never
    // persists credential sessions in the DB), so the app uses JWT sessions.
    strategy: "jwt",
  },

  providers: [
    // ── Credentials (email + password) ─────────────────────────────────────
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email.toLowerCase()),
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.username,
          // Avatars live in DB / profile pages — never in the JWT cookie
          image: cookieSafeImage(user.avatarUrl),
        };
      },
    }),

    // ── GitHub OAuth ────────────────────────────────────────────────────────
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
    }),

    // ── Google OAuth ────────────────────────────────────────────────────────
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],

  pages: {
    signIn: "/sign-in",
    newUser: "/onboarding",
    error: "/sign-in",
  },

  events: {
    async createUser({ user }) {
      // Physical `users.username` is NOT NULL; Auth.js adapter does not set it.
      if (!user.id) return;
      const existing = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { username: true, email: true, displayName: true },
      });
      if (!existing || existing.username) return;

      const base =
        (user.email?.split("@")[0] ?? user.name ?? "user")
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 24) || "user";

      let candidate = base;
      for (let i = 0; i < 8; i++) {
        const clash = await db.query.users.findFirst({
          where: eq(users.username, candidate),
          columns: { id: true },
        });
        if (!clash) break;
        candidate = `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
      }

      await db
        .update(users)
        .set({
          username: candidate,
          displayName: existing.displayName ?? user.name ?? candidate,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    },
  },

  callbacks: {
    async jwt({ token, user, profile }) {
      // Persist DB user id on first sign-in (OAuth + credentials).
      if (user?.id) {
        token.sub = user.id;
      }
      // Strip oversized / data-URL pictures from the JWT (HTTP 431 otherwise)
      const picture =
        cookieSafeImage(
          (user?.image as string | undefined) ??
            (token.picture as string | undefined) ??
            (profile && "picture" in profile
              ? String((profile as { picture?: string }).picture ?? "")
              : null),
        ) ?? undefined;
      if (picture) token.picture = picture;
      else {
        delete token.picture;
        delete token.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      if (session.user) {
        session.user.image = cookieSafeImage(session.user.image) ?? undefined;
      }
      return session;
    },
  },
});
