export type PlatformId =
  | "codeforces"
  | "leetcode"
  | "hackerrank"
  | "atcoder"
  | "codechef"
  | "geeksforgeeks";

export type PlatformMeta = {
  id: PlatformId;
  label: string;
  short: string;
  /** CSS variable for UI accents */
  colorVar: string;
  /** Hex for charts (Recharts) */
  color: string;
  profileUrl: (handle: string) => string;
};

export const PLATFORMS: Record<PlatformId, PlatformMeta> = {
  codeforces: {
    id: "codeforces",
    label: "Codeforces",
    short: "CF",
    colorVar: "var(--v2-cf)",
    color: "#1a73e8",
    profileUrl: (h) => `https://codeforces.com/profile/${h}`,
  },
  leetcode: {
    id: "leetcode",
    label: "LeetCode",
    short: "LC",
    colorVar: "var(--v2-lc)",
    color: "#ffa116",
    profileUrl: (h) => `https://leetcode.com/${h}/`,
  },
  hackerrank: {
    id: "hackerrank",
    label: "HackerRank",
    short: "HR",
    colorVar: "var(--v2-hr)",
    color: "#2ec866",
    profileUrl: (h) => `https://www.hackerrank.com/${h}`,
  },
  atcoder: {
    id: "atcoder",
    label: "AtCoder",
    short: "AC",
    colorVar: "var(--v2-ac)",
    /** Mid slate — readable on light UI; dark theme overrides via --v2-ac */
    color: "#52525b",
    profileUrl: (h) => `https://atcoder.jp/users/${h}`,
  },
  codechef: {
    id: "codechef",
    label: "CodeChef",
    short: "CC",
    colorVar: "var(--v2-cc)",
    color: "#5b4638",
    profileUrl: (h) => `https://www.codechef.com/users/${h}`,
  },
  geeksforgeeks: {
    id: "geeksforgeeks",
    label: "GeeksforGeeks",
    short: "GFG",
    colorVar: "var(--v2-gfg)",
    color: "#2f8d46",
    profileUrl: (h) => `https://auth.geeksforgeeks.org/user/${h}`,
  },
};

/** Shared alias for chips, badges, charts, heatmap tints. */
export const PLATFORM_META = PLATFORMS;

/** Practice / contest platforms users can link. Hiring-only sites stay out. */
export const LINKABLE_PLATFORMS: PlatformId[] = [
  "codeforces",
  "leetcode",
  "atcoder",
  "codechef",
];
