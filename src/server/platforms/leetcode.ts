/**
 * src/server/platforms/leetcode.ts
 * LeetCode platform adapter.
 * Uses the unofficial LeetCode GraphQL API.
 *
 * Public APIs only expose ~20 recent submissions. Accurate solved counts come
 * from submitStatsGlobal. Question numbers (frontendId) are enriched from the
 * problem catalog. Set LEETCODE_SESSION to sync full AC history for the
 * account that owns that cookie.
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
const REQUEST_DELAY_MS = 1500;

type LcProblemMeta = {
  frontendId: string;
  title: string;
  difficulty: string;
};

let problemCatalog: Map<string, LcProblemMeta> | null = null;
let catalogLoading: Promise<Map<string, LcProblemMeta>> | null = null;

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
    submitStatsGlobal?: {
      acSubmissionNum: Array<{
        difficulty: string;
        count: number;
        submissions: number;
      }>;
    } | null;
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

async function lcGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  opts?: { session?: string; maxRetries?: number },
): Promise<T> {
  const maxRetries = opts?.maxRetries ?? 3;
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": env.SYNC_USER_AGENT,
        Referer: "https://leetcode.com/",
        Origin: "https://leetcode.com",
      };
      if (opts?.session) {
        headers.Cookie = `LEETCODE_SESSION=${opts.session}`;
      }

      const res = await fetch(LC_API_BASE, {
        method: "POST",
        headers,
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

function mapVerdict(statusDisplay: string): Verdict {
  if (statusDisplay === "Accepted") return "OK";
  if (statusDisplay === "Wrong Answer") return "WRONG_ANSWER";
  if (statusDisplay === "Time Limit Exceeded") return "TIME_LIMIT_EXCEEDED";
  if (statusDisplay === "Memory Limit Exceeded") return "MEMORY_LIMIT_EXCEEDED";
  if (statusDisplay === "Runtime Error") return "RUNTIME_ERROR";
  if (statusDisplay === "Compile Error") return "COMPILATION_ERROR";
  return "OTHER";
}

/** Load slug → { frontendId, title, difficulty } for correct question numbers. */
async function ensureProblemCatalog(): Promise<Map<string, LcProblemMeta>> {
  if (problemCatalog) return problemCatalog;
  if (catalogLoading) return catalogLoading;

  catalogLoading = (async () => {
    const map = new Map<string, LcProblemMeta>();
    const limit = 500;
    let skip = 0;
    const query = `
      query($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            frontendQuestionId: questionFrontendId
            title
            titleSlug
            difficulty
          }
        }
      }
    `;

    // Cap pages so a sync can't hang forever (~5k problems)
    for (let page = 0; page < 12; page++) {
      await sleep(page === 0 ? 0 : REQUEST_DELAY_MS);
      const data = await lcGraphQL<{
        problemsetQuestionList: {
          total: number;
          questions: Array<{
            frontendQuestionId: string;
            title: string;
            titleSlug: string;
            difficulty: string;
          }>;
        };
      }>(query, {
        categorySlug: "",
        limit,
        skip,
        filters: {},
      });

      const questions = data.problemsetQuestionList?.questions ?? [];
      for (const q of questions) {
        map.set(q.titleSlug, {
          frontendId: q.frontendQuestionId,
          title: q.title,
          difficulty: q.difficulty,
        });
      }
      skip += questions.length;
      if (questions.length < limit) break;
    }

    problemCatalog = map;
    return map;
  })();

  try {
    return await catalogLoading;
  } finally {
    catalogLoading = null;
  }
}

async function enrichProblem(
  titleSlug: string,
  fallbackTitle: string,
): Promise<{
  externalId: string;
  title: string;
  url: string;
  difficultyLabel?: string;
}> {
  const catalog = await ensureProblemCatalog();
  let meta = catalog.get(titleSlug);

  if (!meta) {
    try {
      await sleep(400);
      const data = await lcGraphQL<{
        question: {
          questionFrontendId: string;
          title: string;
          difficulty: string;
        } | null;
      }>(
        `query($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionFrontendId
            title
            difficulty
          }
        }`,
        { titleSlug },
      );
      if (data.question) {
        meta = {
          frontendId: data.question.questionFrontendId,
          title: data.question.title,
          difficulty: data.question.difficulty,
        };
        catalog.set(titleSlug, meta);
      }
    } catch {
      // keep fallback
    }
  }

  const title = meta
    ? `${meta.frontendId}. ${meta.title}`
    : fallbackTitle;
  return {
    externalId: titleSlug,
    title,
    url: `https://leetcode.com/problems/${titleSlug}/`,
    difficultyLabel: meta?.difficulty,
  };
}

function toNormalized(
  s: {
    id: string;
    title: string;
    titleSlug: string;
    timestamp: string;
    statusDisplay: string;
    lang?: string;
  },
  problem: Awaited<ReturnType<typeof enrichProblem>>,
): NormalizedSubmission {
  return {
    externalSubmissionId: String(s.id),
    problem,
    verdict: mapVerdict(s.statusDisplay),
    language: s.lang,
    submittedAt: new Date(parseInt(s.timestamp, 10) * 1000),
    isContest: false,
  };
}

/**
 * Paginate authenticated submissionList (requires LEETCODE_SESSION for that user).
 */
async function fetchAuthenticatedSubmissions(
  session: string,
  sinceSeconds: number,
): Promise<
  Array<{
    id: string;
    title: string;
    titleSlug: string;
    timestamp: string;
    statusDisplay: string;
    lang: string;
  }>
> {
  const results: Array<{
    id: string;
    title: string;
    titleSlug: string;
    timestamp: string;
    statusDisplay: string;
    lang: string;
  }> = [];
  let offset = 0;
  const limit = 20;
  let lastKey: string | null = null;
  let pages = 0;
  const maxPages = 200; // up to ~4000 submissions

  const query = `
    query($offset: Int!, $limit: Int!, $lastKey: String) {
      submissionList(offset: $offset, limit: $limit, lastKey: $lastKey) {
        hasNext
        lastKey
        submissions {
          id
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    }
  `;

  type SubmissionListPayload = {
    submissionList: {
      hasNext: boolean;
      lastKey: string | null;
      submissions: Array<{
        id: string;
        title: string;
        titleSlug: string;
        timestamp: string;
        statusDisplay: string;
        lang: string;
      }>;
    };
  };

  while (pages < maxPages) {
    pages++;
    await sleep(pages === 1 ? 0 : REQUEST_DELAY_MS);
    const data: SubmissionListPayload = await lcGraphQL<SubmissionListPayload>(
      query,
      { offset, limit, lastKey },
      { session },
    );

    const page: SubmissionListPayload["submissionList"] = data.submissionList;
    if (!page?.submissions?.length) break;

    let pastSince = false;
    for (const s of page.submissions) {
      const ts = parseInt(s.timestamp, 10);
      if (ts < sinceSeconds) {
        pastSince = true;
        break;
      }
      results.push(s);
    }

    if (pastSince || !page.hasNext) break;
    lastKey = page.lastKey;
    offset += page.submissions.length;
  }

  return results;
}

export const leetcodeAdapter: PlatformAdapter = {
  id: "leetcode",

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
      const data = await lcGraphQL<{
        recentSubmissionList: LCSubmission[] | null;
      }>(query, { username: handle, limit: 10 });
      const subs = data.recentSubmissionList || [];
      const oneHourAgo = Date.now() / 1000 - 3600;

      return subs.some(
        (s) =>
          parseInt(s.timestamp) > oneHourAgo &&
          s.statusDisplay !== "Accepted" &&
          s.titleSlug === "two-sum",
      );
    } catch {
      return false;
    }
  },

  async fetchProfile(handle: string): Promise<ProfileSnapshot> {
    await sleep(REQUEST_DELAY_MS);

    const query = `
      query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            userAvatar
            realName
            aboutMe
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
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

    const allStat = data.matchedUser.submitStatsGlobal?.acSubmissionNum?.find(
      (s) => s.difficulty === "All",
    );

    return {
      handle: data.matchedUser.username,
      displayName:
        data.matchedUser.profile.realName || data.matchedUser.username,
      currentRating: data.userContestRanking?.rating
        ? Math.round(data.userContestRanking.rating)
        : undefined,
      rank: data.userContestRanking?.globalRanking
        ? String(data.userContestRanking.globalRanking)
        : undefined,
      avatarUrl: data.matchedUser.profile.userAvatar,
      solvedCount: allStat?.count,
    };
  },

  async fetchSubmissions(
    handle: string,
    since: Date,
  ): Promise<NormalizedSubmission[]> {
    const sinceSeconds = Math.floor(since.getTime() / 1000);
    const session = env.LEETCODE_SESSION?.trim() || undefined;

    // Warm catalog so titles get correct question numbers (e.g. "1. Two Sum")
    await ensureProblemCatalog();

    const raw: Array<{
      id: string;
      title: string;
      titleSlug: string;
      timestamp: string;
      statusDisplay: string;
      lang?: string;
    }> = [];
    const seen = new Set<string>();

    // Prefer full history when session cookie is configured
    if (session) {
      try {
        const authSubs = await fetchAuthenticatedSubmissions(
          session,
          sinceSeconds,
        );
        for (const s of authSubs) {
          if (seen.has(s.id)) continue;
          seen.add(s.id);
          raw.push(s);
        }
      } catch (err) {
        console.error("[LeetCode] authenticated submissionList failed:", err);
      }
    }

    // Public recent AC + recent submissions (capped by LeetCode ~20)
    await sleep(REQUEST_DELAY_MS);
    const acData = await lcGraphQL<{
      recentAcSubmissionList: Array<{
        id: string;
        title: string;
        titleSlug: string;
        timestamp: string;
      }> | null;
    }>(
      `query($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id title titleSlug timestamp
        }
      }`,
      { username: handle, limit: 20 },
    );
    for (const s of acData.recentAcSubmissionList ?? []) {
      if (parseInt(s.timestamp, 10) < sinceSeconds) continue;
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      raw.push({ ...s, statusDisplay: "Accepted", lang: undefined });
    }

    await sleep(REQUEST_DELAY_MS);
    const recentData = await lcGraphQL<{
      recentSubmissionList: LCSubmission[] | null;
    }>(
      `query($username: String!, $limit: Int!) {
        recentSubmissionList(username: $username, limit: $limit) {
          id title titleSlug timestamp statusDisplay lang
        }
      }`,
      { username: handle, limit: 20 },
    );
    for (const s of recentData.recentSubmissionList ?? []) {
      if (parseInt(s.timestamp, 10) < sinceSeconds) continue;
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      raw.push(s);
    }

    // Deduplicate by problem for enrichment batching, but keep all submissions
    const results: NormalizedSubmission[] = [];
    for (const s of raw) {
      const problem = await enrichProblem(s.titleSlug, s.title);
      results.push(toNormalized(s, problem));
    }

    return results;
  },

  async fetchActivityCalendar(handle: string): Promise<Record<string, number>> {
    const calendarQuery = `
      query userProfileCalendar($username: String!, $year: Int) {
        matchedUser(username: $username) {
          userCalendar(year: $year) {
            activeYears
            submissionCalendar
          }
        }
      }
    `;

    await sleep(REQUEST_DELAY_MS);
    const first = await lcGraphQL<{
      matchedUser: {
        userCalendar: {
          activeYears: number[];
          submissionCalendar: string;
        } | null;
      } | null;
    }>(calendarQuery, {
      username: handle,
      year: new Date().getFullYear(),
    });

    const cal = first.matchedUser?.userCalendar;
    if (!cal) return {};

    const years = [
      ...new Set([...(cal.activeYears ?? []), new Date().getFullYear()]),
    ].sort((a, b) => a - b);

    const merged: Record<string, number> = {};
    const applyCalendar = (raw: string | null | undefined) => {
      if (!raw) return;
      let parsed: Record<string, number>;
      try {
        parsed = JSON.parse(raw) as Record<string, number>;
      } catch {
        return;
      }
      for (const [ts, count] of Object.entries(parsed)) {
        const date = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
        merged[date] = Math.max(merged[date] ?? 0, Number(count) || 0);
      }
    };

    applyCalendar(cal.submissionCalendar);

    for (const year of years) {
      if (year === new Date().getFullYear()) continue;
      await sleep(REQUEST_DELAY_MS);
      const yearData = await lcGraphQL<{
        matchedUser: {
          userCalendar: { submissionCalendar: string } | null;
        } | null;
      }>(calendarQuery, { username: handle, year });
      applyCalendar(yearData.matchedUser?.userCalendar?.submissionCalendar);
    }

    return merged;
  },

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

    let prevRating = 1500;
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
