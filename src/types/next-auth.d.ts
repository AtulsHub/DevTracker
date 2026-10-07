/**
 * src/types/next-auth.d.ts
 * Type extensions for NextAuth.js session.
 */
import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}