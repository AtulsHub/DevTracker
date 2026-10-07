/**
 * src/lib/utils.ts
 * Shared utility functions used across the app.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind CSS classes without conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date to a locale-aware string. */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

/** Format a relative time (e.g. "2 hours ago"). */
export function formatRelativeTime(date: Date | string | number): string {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diff = (new Date(date).getTime() - Date.now()) / 1000;

  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), "second");
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

/** Capitalize first letter of a string. */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Truncate a string to a max length. */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

/** Sleep for a given number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a random alphanumeric token of given length. */
export function generateToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** Platform display colors for UI badges. */
export const PLATFORM_COLORS: Record<string, string> = {
  codeforces: "#1976D2",
  leetcode: "#FFA116",
  atcoder: "#006FCC",
  codechef: "#5B4638",
  hackerrank: "#2EC866",
  hackerearth: "#323754",
  cses: "#4CAF50",
  kattis: "#f15922",
};
