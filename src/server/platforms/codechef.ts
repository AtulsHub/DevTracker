/**
 * CodeChef platform adapter (best-effort).
 * Profile + upcoming contests via public endpoints; submissions remain limited.
 */
import { sleep } from "@/lib/utils";
import { env } from "@/env";
import type {
  PlatformAdapter,
  ProfileSnapshot,
  NormalizedSubmission,
  NormalizedContestResult,
  NormalizedContest,
} from "./types";

const CC_BASE = "https://www.codechef.com";
const REQUEST_DELAY_MS = 1500;

async function fetchText(url: string, retries = 2): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": env.SYNC_USER_AGENT },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      await sleep(REQUEST_DELAY_MS);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": env.SYNC_USER_AGENT,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

function parseProfile(html: string) {
  const currentMatches = [...html.matchAll(/"rating"\s*:\s*"?(\d+)/g)];
  const currentRating = currentMatches.length
    ? Number(currentMatches[currentMatches.length - 1]![1])
    : undefined;

  const highestMatch = html.match(/Highest Rating\s*(\d+)/i);
  const maxRating = highestMatch ? Number(highestMatch[1]) : undefined;

  const rankMatch = html.match(/global rank\s*(\d+)/i);
  const globalRank = rankMatch ? Number(rankMatch[1]) : undefined;

  return { currentRating, maxRating, globalRank };
}

interface CcContestRow {
  contest_code: string;
  contest_name: string;
  contest_start_date_iso?: string;
  contest_end_date_iso?: string;
  contest_duration?: string;
}

interface CcContestList {
  future_contests?: CcContestRow[];
  present_contests?: CcContestRow[];
}

export const codechefAdapter: PlatformAdapter = {
  id: "codechef",

  async verifyOwnership(handle: string, token: string): Promise<boolean> {
    try {
      const html = await fetchText(
        `${CC_BASE}/users/${encodeURIComponent(handle)}`,
      );
      return html.includes(token);
    } catch {
      return false;
    }
  },

  async fetchProfile(handle: string): Promise<ProfileSnapshot> {
    const html = await fetchText(
      `${CC_BASE}/users/${encodeURIComponent(handle)}`,
    );
    const isProfile =
      html.includes("User profile of") || html.includes("CodeChef User");
    if (!isProfile) {
      throw new Error(`Handle '${handle}' not found on CodeChef`);
    }
    const p = parseProfile(html);
    return {
      handle,
      currentRating: p.currentRating,
      maxRating: p.maxRating,
      rank: p.globalRank !== undefined ? String(p.globalRank) : undefined,
    };
  },

  async fetchSubmissions(): Promise<NormalizedSubmission[]> {
    // Public submission history is not stably available without scraping/auth.
    return [];
  },

  async fetchContestHistory(): Promise<NormalizedContestResult[]> {
    return [];
  },

  async fetchUpcomingContests(): Promise<NormalizedContest[]> {
    try {
      await sleep(REQUEST_DELAY_MS);
      const data = await fetchJson<CcContestList>(
        `${CC_BASE}/api/list/contests/all`,
      );
      const rows = [
        ...(data.present_contests ?? []),
        ...(data.future_contests ?? []),
      ];
      return rows
        .filter((c) => c.contest_code && c.contest_start_date_iso)
        .map((c) => {
          const startsAt = new Date(c.contest_start_date_iso!);
          const endsAt = c.contest_end_date_iso
            ? new Date(c.contest_end_date_iso)
            : null;
          const durationSeconds =
            endsAt && !Number.isNaN(endsAt.getTime())
              ? Math.max(
                  0,
                  Math.round((endsAt.getTime() - startsAt.getTime()) / 1000),
                )
              : c.contest_duration
                ? Number(c.contest_duration) * 60
                : undefined;
          return {
            externalId: c.contest_code,
            name: c.contest_name,
            url: `${CC_BASE}/${c.contest_code}`,
            startsAt,
            durationSeconds,
            phase: "BEFORE" as const,
          };
        })
        .filter((c) => c.startsAt.getTime() >= Date.now() - 3 * 60 * 60 * 1000);
    } catch {
      return [];
    }
  },
};
