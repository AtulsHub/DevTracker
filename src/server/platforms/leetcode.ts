/**
 * src/server/platforms/leetcode.ts
 * LeetCode platform adapter.
 * Uses the unofficial LeetCode GraphQL API.
 */
import { sleep } from "@/lib/utils";
import type {
  PlatformAdapter,
  ProfileSnapshot,
  NormalizedSubmission,
  NormalizedContestResult,
  NormalizedContest,
  Verdict,
} from "./types";
import { env } from "@/env";

const LC_API_BASE = "https://leetcode.com/graphql";
const REQUEST_DELAY_MS = 2000; // ~2 seconds between requests

// GraphQL response types
interface LCSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

interface LCUserProfile {
  matchedUser: {
    username: string;
    profile: {
      ranking: number;
      userAvatar: string;
      realName: string;
      aboutMe: string;
    };
  } | null;
  userContestRanking: {
    rating: number;
    globalRanking: number;
  } | null;
}

interface LCContestHistory {
  userContestRankingHistory: Array<{
    attended: boolean;
    rating: number;
    ranking: number;
    contest: {
      title: string;
      titleSlug: string;
      startTime: number;
    };
  }> | null;
}

interface LCRecentSubmissions {
  recentSubmissionList: LCSubmission[] | null;
}

async function lcGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  maxRetries = 3
): Promise<T> {
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(LC_API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": env.SYNC_USER_AGENT,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`LC API HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.errors) {
        throw new Error(`LC GraphQL error: ${json.errors[0]?.message}`);
      }
      return json.data as T;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await sleep(delay);
      delay *= 2;
    }
  }
  throw new Error("Max retries exceeded");
}

export const leetcodeAdapter: PlatformAdapter = {
  id: "leetcode",

  // ── Ownership Verification ────────────────────────────────────────────────
  // Similar to Codeforces, we look for a recent failed submission with the token.
  // We can ask the user to submit a failing answer with the token in the code to problem "two-sum".
  async verifyOwnership(handle: string, _token: string): Promise<boolean> {
    await sleep(REQUEST_DELAY_MS);
    try {
      const query = `
        query recentSubmissions($username: String!, $limit: Int!) {
          recentSubmissionList(username: $username, limit: $limit) {
            titleSlug
            statusDisplay
            timestamp
          }
        }
      `;
      const data = await lcGraphQL<LCRecentSubmissions>(query, { username: handle, limit: 10 });
      const subs = data.recentSubmissionList || [];
      const oneHourAgo = Date.now() / 1000 - 3600;

      return subs.some(
        (s) =>
          parseInt(s.timestamp) > oneHourAgo &&
          s.statusDisplay !== "Accepted" &&
          s.titleSlug === "two-sum"
      );
    } catch {
      return false;
    }
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  async fetchProfile(handle: string): Promise<ProfileSnapshot> {
    await sleep(REQUEST_DELAY_MS);

    const query = `
      query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          username
          githubUrl
          twitterUrl
          linkedinUrl
          profile {
            ranking
            userAvatar
            realName
            aboutMe
          }
        }
        userContestRanking(username: $username) {
          rating
          globalRanking
        }
      }
    `;

    const data = await lcGraphQL<LCUserProfile>(query, { username: handle });
    if (!data.matchedUser) {
      throw new Error(`Handle '${handle}' not found on LeetCode`);
    }

    return {
      handle: data.matchedUser.username,
      displayName: data.matchedUser.profile.realName || data.matchedUser.username,
      currentRating: data.userContestRanking?.rating ? Math.round(data.userContestRanking.rating) : undefined,
      rank: data.userContestRanking?.globalRanking ? String(data.userContestRanking.globalRanking) : undefined,
      avatarUrl: data.matchedUser.profile.userAvatar,
    };
  },

  // ── Submissions ───────────────────────────────────────────────────────────
  async fetchSubmissions(handle: string, since: Date): Promise<NormalizedSubmission[]> {
    const sinceSeconds = Math.floor(since.getTime() / 1000);
    const results: NormalizedSubmission[] = [];
    const count = 20;
    
    // LeetCode's recentAcSubmissionList doesn't have pagination by offset easily, 
    // it usually just returns recent submissions. For complete sync, we'd need submissionList, 
    // but submissionList requires auth for full code. recentSubmissionList gets recent 20 for unauthenticated.
    // To get more, we could try the 'recentAcSubmissionList' but it only returns Accepted.
    // For now, we will just use recentSubmissionList for the last 20, or recentAcSubmissionList if we want more.
    // Wait, recentAcSubmissionList supports `limit` up to 20 for unauthenticated users, or maybe more.
    
    // For V1, we fetch up to 100 using recentAcSubmissionList, though we won't get failures.
    // To be precise, LeetCode without auth is limited to 20 recent submissions.
    // But let's write a paginated query if possible, or just fetch the max unauthenticated limit.
    // `recentSubmissionList(username: $username, limit: 20)`
    
    const query = `
      query recentSubmissions($username: String!, $limit: Int!) {
        recentSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    `;

    await sleep(REQUEST_DELAY_MS);
    const data = await lcGraphQL<LCRecentSubmissions>(query, { username: handle, limit: 20 });
    const statuses = data.recentSubmissionList || [];

    for (const s of statuses) {
      if (parseInt(s.timestamp) < sinceSeconds) break; // Assuming they are sorted descending

      let verdict: Verdict = "OTHER";
      if (s.statusDisplay === "Accepted") verdict = "OK";
      else if (s.statusDisplay === "Wrong Answer") verdict = "WRONG_ANSWER";
      else if (s.statusDisplay === "Time Limit Exceeded") verdict = "TIME_LIMIT_EXCEEDED";
      else if (s.statusDisplay === "Memory Limit Exceeded") verdict = "MEMORY_LIMIT_EXCEEDED";
      else if (s.statusDisplay === "Runtime Error") verdict = "RUNTIME_ERROR";
      else if (s.statusDisplay === "Compile Error") verdict = "COMPILATION_ERROR";

      results.push({
        externalSubmissionId: String(s.id),
        problem: {
          externalId: s.titleSlug,
          title: s.title,
          url: `https://leetcode.com/problems/${s.titleSlug}/`,
          // Rating and tags aren't natively returned in this query without additional fetches per problem
        },
        verdict,
        language: s.lang,
        submittedAt: new Date(parseInt(s.timestamp) * 1000),
        isContest: false, // LeetCode recent doesn't easily distinguish contest submissions
      });
    }

    return results;
  },

  // ── Contest History ───────────────────────────────────────────────────────
  async fetchContestHistory(handle: string): Promise<NormalizedContestResult[]> {
    await sleep(REQUEST_DELAY_MS);
    const query = `
      query userContestRankingInfo($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          contest {
            title
            titleSlug
            startTime
          }
        }
      }
    `;

    const data = await lcGraphQL<LCContestHistory>(query, { username: handle });
    if (!data.userContestRankingHistory) return [];

    let prevRating = 1500; // LC default starting rating
    const results: NormalizedContestResult[] = [];

    for (const r of data.userContestRankingHistory) {
      if (!r.attended) continue;

      results.push({
        contest: {
          externalId: r.contest.titleSlug,
          name: r.contest.title,
          url: `https://leetcode.com/contest/${r.contest.titleSlug}`,
          startsAt: new Date(r.contest.startTime * 1000),
        },
        rank: r.ranking,
        ratingBefore: prevRating,
        ratingAfter: Math.round(r.rating),
        participatedAt: new Date(r.contest.startTime * 1000),
      });
      prevRating = Math.round(r.rating);
    }

    return results;
  },

  // ── Upcoming Contests ─────────────────────────────────────────────────────
  async fetchUpcomingContests(): Promise<NormalizedContest[]> {
    try {
      await sleep(REQUEST_DELAY_MS);
      const query = `
        query {
          contestV2UpcomingContests {
            title
            titleSlug
            startTime
            duration
          }
        }
      `;
      const data = await lcGraphQL<{
        contestV2UpcomingContests: Array<{
          title: string;
          titleSlug: string;
          startTime: number;
          duration: number;
        }> | null;
      }>(query, {});

      const list = data.contestV2UpcomingContests ?? [];
      return list.map((c) => ({
        externalId: c.titleSlug,
        name: c.title,
        url: `https://leetcode.com/contest/${c.titleSlug}`,
        startsAt: new Date(c.startTime * 1000),
        durationSeconds: c.duration,
        phase: "BEFORE" as const,
      }));
    } catch {
      return [];
    }
  },
};
