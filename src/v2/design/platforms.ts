export type PlatformId =
  | "codeforces"
  | "leetcode"
  | "hackerrank"
  | "atcoder"
  | "codechef"
  | "geeksforgeeks";

export const PLATFORMS: Record<
  PlatformId,
  {
    id: PlatformId;
    label: string;
    short: string;
    colorVar: string;
    profileUrl: (handle: string) => string;
  }
> = {
  codeforces: {
    id: "codeforces",
    label: "Codeforces",
    short: "CF",
    colorVar: "var(--v2-cf)",
    profileUrl: (h) => `https://codeforces.com/profile/${h}`,
  },
  leetcode: {
    id: "leetcode",
    label: "LeetCode",
    short: "LC",
    colorVar: "var(--v2-lc)",
    profileUrl: (h) => `https://leetcode.com/${h}/`,
  },
  hackerrank: {
    id: "hackerrank",
    label: "HackerRank",
    short: "HR",
    colorVar: "var(--v2-hr)",
    profileUrl: (h) => `https://www.hackerrank.com/${h}`,
  },
  atcoder: {
    id: "atcoder",
    label: "AtCoder",
    short: "AC",
    colorVar: "var(--v2-ac)",
    profileUrl: (h) => `https://atcoder.jp/users/${h}`,
  },
  codechef: {
    id: "codechef",
    label: "CodeChef",
    short: "CC",
    colorVar: "var(--v2-cc)",
    profileUrl: (h) => `https://www.codechef.com/users/${h}`,
  },
  geeksforgeeks: {
    id: "geeksforgeeks",
    label: "GeeksforGeeks",
    short: "GFG",
    colorVar: "var(--v2-gfg)",
    profileUrl: (h) => `https://auth.geeksforgeeks.org/user/${h}`,
  },
};

export const LINKABLE_PLATFORMS: PlatformId[] = [
  "codeforces",
  "leetcode",
  "hackerrank",
  "atcoder",
  "codechef",
];
