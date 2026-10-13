/**
 * Platform adapter registry — maps platform IDs to adapters.
 */
import { codeforcesAdapter } from "./codeforces";
import { leetcodeAdapter } from "./leetcode";
import { atcoderAdapter } from "./atcoder";
import { codechefAdapter } from "./codechef";
import { hackerrankAdapter } from "./hackerrank";
import type { PlatformAdapter, PlatformId } from "./types";

export const platformAdapters: Record<string, PlatformAdapter> = {
  codeforces: codeforcesAdapter,
  leetcode: leetcodeAdapter,
  atcoder: atcoderAdapter,
  codechef: codechefAdapter,
  hackerrank: hackerrankAdapter,
};

/** Registered platform ids only (safe for cron loops). */
export function listRegisteredPlatforms(): string[] {
  return Object.keys(platformAdapters);
}

export function tryGetAdapter(platform: string): PlatformAdapter | null {
  return platformAdapters[platform] ?? null;
}

export function getAdapter(platform: PlatformId | string): PlatformAdapter {
  const adapter = platformAdapters[platform];
  if (!adapter) {
    throw new Error(`No adapter registered for platform: ${platform}`);
  }
  return adapter;
}

export type { PlatformAdapter, PlatformId };
