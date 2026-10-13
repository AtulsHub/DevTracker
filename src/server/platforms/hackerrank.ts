/**
 * HackerRank adapter — public REST endpoints (no official API key).
 * Best-effort: recent_challenges ≈ solved history; heatmap may be empty for some users.
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

const HR_BASE = "https://www.hackerrank.com";
const REQUEST_DELAY_MS = 1200;

async function hrFetch<T>(path: string, retries = 3): Promise<T> {
  let delay = 800;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(`${HR_BASE}${path}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": env.SYNC_USER_AGENT,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.status === 404) {
        throw new Error("HackerRank profile not found");
      }
      if (!res.ok) throw new Error(`HackerRank HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      await sleep(delay);
      delay *= 2;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

interface HrProfileModel {
  username?: string;
  name?: string;
  avatar?: string;
  about?: string;
  country?: string;
  school?: string;
  company?: string;
  job_title?: string;
  website?: string;
  linkedin_url?: string;
  github_url?: string;
}

interface HrProfileResponse {
  model?: HrProfileModel;
}

interface HrBadge {
  badge_name?: string;
  solved?: number;
}

interface HrBadgesResponse {
  models?: HrBadge[];
}

interface HrChallenge {
  id?: number | string;
  ch_slug?: string;
  name?: string;
  url?: string;
  created_at?: string;
  track?: { name?: string } | null;
}

interface HrRecentChallenges {
  data?: HrChallenge[];
  cursor?: string | null;
}

interface HrContestParticipation {
  models?: Array<{
    contest_name?: string;
    contest_slug?: string;
    contest_ended_at?: string;
    rank?: number;
    score?: number;
  }>;
}

export const hackerrankAdapter: PlatformAdapter = {
  id: "hackerrank",

  async verifyOwnership(handle: string, token: string): Promise<boolean> {
    try {
      const data = await hrFetch<HrProfileResponse>(
        `/rest/contests/master/hackers/${encodeURIComponent(handle)}/profile`,
      );
      const about = data.model?.about ?? "";
      return about.includes(token);
    } catch {
      return false;
    }
  },

  async fetchProfile(handle: string): Promise<ProfileSnapshot> {
    await sleep(REQUEST_DELAY_MS);
    const profile = await hrFetch<HrProfileResponse>(
      `/rest/contests/master/hackers/${encodeURIComponent(handle)}/profile`,
    );
    if (!profile.model?.username && !profile.model?.name) {
      throw new Error(`Handle '${handle}' not found on HackerRank`);
    }

    let solvedCount: number | undefined;
    try {
      await sleep(REQUEST_DELAY_MS);
      const badges = await hrFetch<HrBadgesResponse>(
        `/rest/hackers/${encodeURIComponent(handle)}/badges`,
      );
      const sum = (badges.models ?? []).reduce(
        (acc, b) => acc + (typeof b.solved === "number" ? b.solved : 0),
        0,
      );
      if (sum > 0) solvedCount = sum;
    } catch {
      // badges optional
    }

    return {
      handle: profile.model?.username ?? handle,
      displayName: profile.model?.name,
      avatarUrl: profile.model?.avatar,
      solvedCount,
      rank: profile.model?.job_title ?? profile.model?.company,
    };
  },

  async fetchSubmissions(
    handle: string,
    since: Date,
  ): Promise<NormalizedSubmission[]> {
    const sinceMs = since.getTime();
    const results: NormalizedSubmission[] = [];
    let cursor: string | null | undefined = undefined;
    let pages = 0;

    do {
      await sleep(REQUEST_DELAY_MS);
      const qs = new URLSearchParams({
        limit: "100",
        response_version: "v2",
      });
      if (cursor) qs.set("cursor", cursor);

      const page = await hrFetch<HrRecentChallenges>(
        `/rest/hackers/${encodeURIComponent(handle)}/recent_challenges?${qs}`,
      );

      const items = page.data ?? [];
      for (const ch of items) {
        const created = ch.created_at ? new Date(ch.created_at) : null;
        if (created && created.getTime() < sinceMs) {
          // Challenges are roughly newest-first; stop early when past since
          cursor = null;
          break;
        }
        const slug = ch.ch_slug ?? String(ch.id ?? "");
        if (!slug) continue;
        results.push({
          externalSubmissionId: `hr-${slug}-${ch.created_at ?? ch.id ?? results.length}`,
          problem: {
            externalId: slug,
            title: ch.name ?? slug,
            url:
              ch.url ??
              `https://www.hackerrank.com/challenges/${slug}/problem`,
            tags: ch.track?.name ? [ch.track.name] : undefined,
          },
          verdict: "OK",
          submittedAt: created ?? new Date(),
          isContest: false,
        });
      }

      cursor = page.cursor ?? null;
      pages += 1;
    } while (cursor && pages < 25);

    return results;
  },

  async fetchContestHistory(
    handle: string,
  ): Promise<NormalizedContestResult[]> {
    try {
      await sleep(REQUEST_DELAY_MS);
      const data = await hrFetch<HrContestParticipation>(
        `/rest/hackers/${encodeURIComponent(handle)}/contest_participation?offset=0&limit=50`,
      );
      return (data.models ?? [])
        .filter((c) => c.contest_slug || c.contest_name)
        .map((c) => {
          const ended = c.contest_ended_at
            ? new Date(c.contest_ended_at)
            : new Date();
          return {
            contest: {
              externalId: c.contest_slug ?? c.contest_name ?? "unknown",
              name: c.contest_name ?? c.contest_slug ?? "Contest",
              url: c.contest_slug
                ? `https://www.hackerrank.com/contests/${c.contest_slug}`
                : undefined,
              startsAt: ended,
            },
            rank: c.rank,
            participatedAt: ended,
          };
        });
    } catch {
      return [];
    }
  },

  async fetchUpcomingContests(): Promise<NormalizedContest[]> {
    // HackerRank public contest calendar is inconsistent without auth; skip for now.
    return [];
  },
};
