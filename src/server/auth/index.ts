/**
 * src/server/auth/index.ts
 * Auth.js (NextAuth v5) configuration.
 * Supports: Credentials (email + password), GitHub OAuth, Google OAuth.
 * Sessions stored in the database (Neon Postgres).
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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Use the Drizzle adapter to persist sessions in Neon Postgres.
  adapter: DrizzleAdapter(db),

  session: {
    strategy: "database",
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
          image: user.avatarUrl,
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

  callbacks: {
    async session({ session, user }) {
      // Attach the DB user id to the session for use in server components.
      if (user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
