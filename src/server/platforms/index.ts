/**
 * src/server/platforms/index.ts
 * Platform adapter registry — maps platform IDs to adapters.
 */
import { codeforcesAdapter } from "./codeforces";
import { leetcodeAdapter } from "./leetcode";
import type { PlatformAdapter, PlatformId } from "./types";

export const platformAdapters: Record<string, PlatformAdapter> = {
  codeforces: codeforcesAdapter,
  leetcode: leetcodeAdapter,
  // atcoder: atcoderAdapter,     // Task 5.x
  // codechef: codechefAdapter,   // Task 5.x
};

export function getAdapter(platform: PlatformId): PlatformAdapter {
  const adapter = platformAdapters[platform];
  if (!adapter) {
    throw new Error(`No adapter registered for platform: ${platform}`);
  }
  return adapter;
}

export type { PlatformAdapter, PlatformId };
