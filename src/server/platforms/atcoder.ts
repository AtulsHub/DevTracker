/**
 * src/server/platforms/atcoder.ts
 * AtCoder platform adapter (via kenkoooo community API).
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

const ATCODER_BASE = "https://atcoder.jp";
const KENKOOO_BASE = "https://kenkoooo.com/atcoder";
const REQUEST_DELAY_MS = 1500;
const MAX_SUBMISSIONS = 3000; // cap slice for initial backfill

interface AtCoderHistoryEntry {
  IsRated: boolean;
  Place: number;
  OldRating: number;
  NewRating: number;
  Performance: number;
  ContestScreenName: string;
  ContestName: string;
  EndTime: string;
}

interface AtCoderSubmission {
  id: number;
  epoch_second: number;
  problem_id: string;
  contest_id: string;
  user_id: string;
  language: string;
  point: number;
  length: number;
  result: string;
  execution_time?: number;
}

async function fetchJson<T>(url: string, retries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
      await sleep(REQUEST_DELAY_MS);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function fetchText(url: string, retries = 2): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      await sleep(REQUEST_DELAY_MS);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function mapVerdict(result: string): Verdict {
  switch (result) {
    case "AC":
      return "OK";
    case "WA":
      return "WRONG_ANSWER";
    case "TLE":
      return "TIME_LIMIT_EXCEEDED";
    case "MLE":
      return "MEMORY_LIMIT_EXCEEDED";
    case "RE":
      return "RUNTIME_ERROR";
    case "CE":
      return "COMPILATION_ERROR";
    case "OLE":
      return "OTHER";
    default:
      return "OTHER";
  }
}

// Cache problem titles from kenkoooo
let problemsCache: Promise<Map<string, string>> | null = null;
function loadProblemTitles(): Promise<Map<string, string>> {
  if (!problemsCache) {
    problemsCache = (async () => {
      try {
        const arr = await fetchJson<Array<{ id: string; name?: string; title?: string }>>(
          `${KENKOOO_BASE}/resources/problems.json`
        );
        const m = new Map<string, string>();
        for (const p of arr) {
          m.set(p.id, p.title ?? p.name ?? p.id);
        }
        return m;
      } catch {
        return new Map();
      }
    })();
  }
  return problemsCache;
}

export const atcoderAdapter: PlatformAdapter = {
  id: "atcoder",

  async verifyOwnership(handle: string, token: string): Promise<boolean> {
    try {
      const html = await fetchText(`${ATCODER_BASE}/users/${encodeURIComponent(handle)}`);
      return html.includes(token);
    } catch {
      return false;
    }
  },

  async fetchProfile(handle: string): Promise<ProfileSnapshot> {
    try {
      const history = await fetchJson<AtCoderHistoryEntry[]>(
        `${ATCODER_BASE}/users/${encodeURIComponent(handle)}/history/json`
      );
      if (!Array.isArray(history)) {
        const html = await fetchText(`${ATCODER_BASE}/users/${encodeURIComponent(handle)}`);
        if (!html.includes("AtCoder")) throw new Error(`Handle '${handle}' not found on AtCoder`);
        return { handle };
      }
      if (history.length === 0) {
        // User may exist; try to confirm via page
        const html = await fetchText(`${ATCODER_BASE}/users/${encodeURIComponent(handle)}`);
        if (!html.includes("AtCoder")) throw new Error(`Handle '${handle}' not found on AtCoder`);
        return { handle };
      }
      const rated = history.filter((h) => h.IsRated);
      const current = history[history.length - 1]?.NewRating;
      const max = rated.reduce((m, h) => Math.max(m, h.NewRating), 0);
      return {
        handle,
        currentRating: typeof current === "number" ? current : undefined,
        maxRating: max || undefined,
      };
    } catch (e) {
      throw e;
    }
  },

  async fetchSubmissions(handle: string, since: Date): Promise<NormalizedSubmission[]> {
    const fromSecond = Math.max(0, Math.floor(since.getTime() / 1000));
    // Bound initial window to avoid massive downloads; cover heatmap
    const nowSec = Math.floor(Date.now() / 1000);
    const fromSecBound = fromSecond <= 0 ? Math.max(0, nowSec - 400 * 24 * 60 * 60) : fromSecond;
    const subs = await fetchJson<AtCoderSubmission[]>(
      `${KENKOOO_BASE}/atcoder-api/v3/user/submissions?user=${encodeURIComponent(handle)}&from_second=${fromSecBound}`
    );
    await sleep(REQUEST_DELAY_MS);
    const titles = await loadProblemTitles();
    const list = Array.isArray(subs) ? subs : [];
    const recent = list.length > MAX_SUBMISSIONS ? list.slice(list.length - MAX_SUBMISSIONS) : list;
    return recent.map((s) => {
      const contestId = s.contest_id || undefined;
      const problemUrl = contestId
        ? `https://atcoder.jp/contests/${contestId}/tasks/${s.problem_id}`
        : `https://atcoder.jp/tasks/${s.problem_id}`;
      return {
        externalSubmissionId: String(s.id),
        problem: {
          externalId: s.problem_id,
          title: titles.get(s.problem_id) ?? s.problem_id,
          url: problemUrl,
        },
        verdict: mapVerdict(s.result),
        language: s.language,
        submittedAt: new Date(s.epoch_second * 1000),
        isContest: Boolean(contestId),
        contestId,
      };
    });
  },

  async fetchContestHistory(handle: string): Promise<NormalizedContestResult[]> {
    const history = await fetchJson<AtCoderHistoryEntry[]>(
      `${ATCODER_BASE}/users/${encodeURIComponent(handle)}/history/json`
    );
    const arr = Array.isArray(history) ? history : [];
    return arr
      .filter((h) => h.IsRated)
      .map((h) => {
        const parts = h.ContestScreenName?.split(".") || [];
        const cid = parts[0] || h.ContestScreenName;
        return {
          contest: {
            externalId: cid,
            name: h.ContestName,
            url: cid ? `https://atcoder.jp/contests/${cid}` : undefined,
            startsAt: new Date(h.EndTime),
          },
          rank: h.Place,
          ratingBefore: h.OldRating,
          ratingAfter: h.NewRating,
          participatedAt: new Date(h.EndTime),
        };
      });
  },

  async fetchUpcomingContests(): Promise<NormalizedContest[]> {
    try {
      await sleep(REQUEST_DELAY_MS);
      // kenkoooo contests.json — filter future start times
      const contests = await fetchJson<
        Array<{
          id: string;
          start_epoch_second: number;
          duration_second: number;
          title: string;
        }>
      >(`${KENKOOO_BASE}/resources/contests.json`);

      const now = Math.floor(Date.now() / 1000);
      return contests
        .filter((c) => c.start_epoch_second >= now - 3600)
        .filter((c) => c.start_epoch_second <= now + 60 * 24 * 3600)
        .slice(0, 50)
        .map((c) => ({
          externalId: c.id,
          name: c.title,
          url: `https://atcoder.jp/contests/${c.id}`,
          startsAt: new Date(c.start_epoch_second * 1000),
          durationSeconds: c.duration_second,
          phase: "BEFORE" as const,
        }));
    } catch {
      return [];
    }
  },
};