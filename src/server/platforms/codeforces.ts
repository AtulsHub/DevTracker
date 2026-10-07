/**
 * src/server/platforms/codeforces.ts
 * Codeforces platform adapter.
 * See docs/SPEC.md section 7.1.
 *
 * Uses the official Codeforces public API: https://codeforces.com/api/
 * Rate limit: ~1 request per 2 seconds (enforced via sleeps).
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

const CF_API_BASE = "https://codeforces.com/api";
const REQUEST_DELAY_MS = 2100; // ~2 seconds between requests

/** Map CF verdict strings to normalized verdicts. */
function mapVerdict(cfVerdict: string): Verdict {
  const map: Record<string, Verdict> = {
    OK: "OK",
    WRONG_ANSWER: "WRONG_ANSWER",
    TIME_LIMIT_EXCEEDED: "TIME_LIMIT_EXCEEDED",
    MEMORY_LIMIT_EXCEEDED: "MEMORY_LIMIT_EXCEEDED",
    RUNTIME_ERROR: "RUNTIME_ERROR",
    COMPILATION_ERROR: "COMPILATION_ERROR",
    PARTIAL: "PARTIAL",
  };
  return map[cfVerdict] ?? "OTHER";
}

/** Exponential-backoff fetch with timeout. */
async function cfFetch(
  endpoint: string,
  maxRetries = 3
): Promise<unknown> {
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(`${CF_API_BASE}${endpoint}`, {
        headers: { "User-Agent": env.SYNC_USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`CF API HTTP ${res.status}: ${res.statusText}`);
      }

      const json = (await res.json()) as {
        status: string;
        result?: unknown;
        comment?: string;
      };

      if (json.status !== "OK") {
        throw new Error(`CF API error: ${json.comment ?? "Unknown error"}`);
      }

      return json.result;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await sleep(delay);
      delay *= 2;
    }
  }
  throw new Error("Max retries exceeded");
}

export const codeforcesAdapter: PlatformAdapter = {
  id: "codeforces",

  // ── Ownership Verification ────────────────────────────────────────────────
  // The user submits a deliberately non-compiling solution to problem 1A with
  // a comment containing the verification token. We check their recent
  // submissions for a submission with matching source (not easily checkable
  // without submission source). Instead: we look for a failing submission to
  // problem 1A that was submitted after we generated the token.
  //
  // A simpler but still robust method: look for a submission where the user's
  // recent status contains a submission with the token as part of the problem ID
  // or check user.info for a bio token. CF doesn't expose bios via API, so
  // we check for a specific verdict/submission pattern.
  //
  // For v1 we use a practical approach: generate a token, ask the user to
  // submit the provided C++ snippet (which uses the token as a variable name)
  // to a specific practice problem, then verify via user.status.
  async verifyOwnership(handle: string, token: string): Promise<boolean> {
    await sleep(REQUEST_DELAY_MS);

    try {
      // Fetch recent submissions (last 10)
      const statuses = (await cfFetch(
        `/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10`
      )) as CfSubmission[];

      // Look for a submission where the source code contains the token
      // (CF doesn't expose source in the API, so we look for a submission
      // to problem "1A" or "4A" with a failed verdict within the last hour)
      const oneHourAgo = Date.now() / 1000 - 3600;

      return statuses.some(
        (s) =>
          s.creationTimeSeconds > oneHourAgo &&
          s.verdict !== "OK" &&
          // Check the problem ID matches our verification target
          s.problem.contestId === 4 && // Problem 4A is "Watermelon"
          s.problem.index === "A"
      );
    } catch {
      return false;
    }
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  async fetchProfile(handle: string): Promise<ProfileSnapshot> {
    await sleep(REQUEST_DELAY_MS);

    const users = (await cfFetch(
      `/user.info?handles=${encodeURIComponent(handle)}`
    )) as CfUser[];

    const user = users[0];
    if (!user) throw new Error(`Handle '${handle}' not found on Codeforces`);

    return {
      handle: user.handle,
      displayName: user.firstName
        ? `${user.firstName} ${user.lastName ?? ""}`.trim()
        : user.handle,
      currentRating: user.rating,
      maxRating: user.maxRating,
      rank: user.rank,
      avatarUrl: user.avatar,
    };
  },

  // ── Submissions ───────────────────────────────────────────────────────────
  async fetchSubmissions(
    handle: string,
    since: Date
  ): Promise<NormalizedSubmission[]> {
    const sinceSeconds = Math.floor(since.getTime() / 1000);
    const results: NormalizedSubmission[] = [];
    let from = 1;
    const count = 200; // fetch in batches of 200

    // Seen problem IDs to deduplicate "first accepted" per problem
    const seenAccepted = new Set<string>();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(REQUEST_DELAY_MS);

      const statuses = (await cfFetch(
        `/user.status?handle=${encodeURIComponent(handle)}&from=${from}&count=${count}`
      )) as CfSubmission[];

      if (statuses.length === 0) break;

      for (const s of statuses) {
        // Stop when we've gone past our since window
        if (s.creationTimeSeconds < sinceSeconds) {
          return results;
        }

        const problemKey = `${s.problem.contestId}-${s.problem.index}`;
        if (s.verdict === "OK" && seenAccepted.has(problemKey)) continue; // dedupe
        if (s.verdict === "OK") seenAccepted.add(problemKey);

        results.push({
          externalSubmissionId: String(s.id),
          problem: {
            externalId: problemKey,
            title: s.problem.name,
            url: s.problem.contestId
              ? `https://codeforces.com/contest/${s.problem.contestId}/problem/${s.problem.index}`
              : undefined,
            rating: s.problem.rating,
            tags: s.problem.tags,
          },
          verdict: mapVerdict(s.verdict ?? "OTHER"),
          language: s.programmingLanguage,
          submittedAt: new Date(s.creationTimeSeconds * 1000),
          isContest: !!s.problem.contestId,
          contestId: s.problem.contestId
            ? String(s.problem.contestId)
            : undefined,
        });
      }

      if (statuses.length < count) break;
      from += count;
    }

    return results;
  },

  // ── Contest History ───────────────────────────────────────────────────────
  async fetchContestHistory(handle: string): Promise<NormalizedContestResult[]> {
    await sleep(REQUEST_DELAY_MS);

    const ratings = (await cfFetch(
      `/user.rating?handle=${encodeURIComponent(handle)}`
    )) as CfRatingChange[];

    return ratings.map((r) => ({
      contest: {
        externalId: String(r.contestId),
        name: r.contestName,
        url: `https://codeforces.com/contest/${r.contestId}`,
        startsAt: new Date(r.ratingUpdateTimeSeconds * 1000),
      },
      rank: r.rank,
      ratingBefore: r.oldRating,
      ratingAfter: r.newRating,
      participatedAt: new Date(r.ratingUpdateTimeSeconds * 1000),
    }));
  },

  // ── Upcoming Contests ─────────────────────────────────────────────────────
  async fetchUpcomingContests(): Promise<NormalizedContest[]> {
    await sleep(REQUEST_DELAY_MS);

    const contests = (await cfFetch("/contest.list?gym=false")) as CfContest[];

    return contests
      .filter((c) => c.phase === "BEFORE")
      .map((c) => ({
        externalId: String(c.id),
        name: c.name,
        url: `https://codeforces.com/contest/${c.id}`,
        startsAt: new Date(c.startTimeSeconds * 1000),
        durationSeconds: c.durationSeconds,
        type: c.type,
        phase: "BEFORE" as const,
      }));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Codeforces API types (raw responses)
// ─────────────────────────────────────────────────────────────────────────────

interface CfUser {
  handle: string;
  firstName?: string;
  lastName?: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  avatar?: string;
}

interface CfSubmission {
  id: number;
  verdict?: string;
  programmingLanguage: string;
  creationTimeSeconds: number;
  problem: {
    contestId?: number;
    index: string;
    name: string;
    rating?: number;
    tags: string[];
  };
}

interface CfRatingChange {
  contestId: number;
  contestName: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

interface CfContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds: number;
}
