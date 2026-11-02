/**
 * Multi-source upcoming contest aggregator.
 * Primary: ContestRadar (free, no key)
 * Optional: CLIST API (CLIST_USERNAME + CLIST_API_KEY)
 * Fallback scrapers for platforms that lack stable public APIs
 */
import { env } from "@/env";
import { platformEnum } from "@/server/db/schema";
import type { NormalizedContest } from "@/server/platforms/types";

type Platform = (typeof platformEnum.enumValues)[number];

const SUPPORTED = new Set<string>(platformEnum.enumValues);

export type AggregatedContest = NormalizedContest & { platform: Platform };

const UA =
  env.SYNC_USER_AGENT ||
  "DevTrack/1.0 (+https://github.com/devtrack; contest-sync)";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": UA,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

function mapPlatformKey(raw: string): Platform | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "");
  const aliases: Record<string, Platform> = {
    codeforces: "codeforces",
    cf: "codeforces",
    leetcode: "leetcode",
    lc: "leetcode",
    atcoder: "atcoder",
    ac: "atcoder",
    codechef: "codechef",
    cc: "codechef",
    hackerrank: "hackerrank",
    hr: "hackerrank",
    hackerearth: "hackerearth",
    he: "hackerearth",
    cses: "cses",
    kattis: "kattis",
    "open.kattis": "kattis",
    "open.kattis.com": "kattis",
  };
  const mapped = aliases[key] ?? (SUPPORTED.has(key) ? (key as Platform) : null);
  return mapped;
}

function toSeconds(duration: number | undefined, unit: "s" | "m"): number | undefined {
  if (duration == null || !Number.isFinite(duration) || duration <= 0) return undefined;
  return unit === "m" ? Math.round(duration * 60) : Math.round(duration);
}

/** ContestRadar — free multi-platform feed (no API key). */
export async function fetchFromContestRadar(): Promise<AggregatedContest[]> {
  type Row = {
    id: string;
    name: string;
    platform?: string;
    platformKey?: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    type?: string;
    url?: string;
    phase?: string;
  };

  const json = await fetchJson<{
    success?: boolean;
    data?: Row[];
  }>("https://contestradar.vercel.app/api/contests");

  const rows = json.data ?? [];
  const now = Date.now() - 60 * 60 * 1000;
  const out: AggregatedContest[] = [];

  for (const row of rows) {
    const platform = mapPlatformKey(row.platformKey ?? row.platform ?? "");
    if (!platform) continue;
    const startsAt = new Date(row.startTime);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < now) continue;

    let durationSeconds = toSeconds(row.duration, "m");
    if (
      durationSeconds == null &&
      row.endTime &&
      !Number.isNaN(new Date(row.endTime).getTime())
    ) {
      durationSeconds = Math.max(
        0,
        Math.round(
          (new Date(row.endTime).getTime() - startsAt.getTime()) / 1000,
        ),
      );
    }

    out.push({
      platform,
      externalId: String(row.id),
      name: row.name,
      url: row.url,
      startsAt,
      durationSeconds,
      type: row.type,
      phase: "BEFORE",
    });
  }

  return out;
}

/** CLIST v2 — optional, richer coverage when credentials are set. */
export async function fetchFromClist(): Promise<AggregatedContest[]> {
  if (!env.CLIST_API_KEY || !env.CLIST_USERNAME) return [];

  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 60);

  const params = new URLSearchParams({
    username: env.CLIST_USERNAME,
    api_key: env.CLIST_API_KEY,
    start__gte: now.toISOString(),
    start__lte: end.toISOString(),
    order_by: "start",
    limit: "200",
  });

  type ClistContest = {
    id: number;
    event: string;
    href?: string;
    start: string;
    end?: string;
    duration?: number;
    resource?: { name?: string; host?: string };
  };

  const json = await fetchJson<{ objects?: ClistContest[] }>(
    `https://clist.by/api/v2/contest/?${params.toString()}`,
  );

  const out: AggregatedContest[] = [];
  for (const c of json.objects ?? []) {
    const host = c.resource?.host ?? c.resource?.name ?? "";
    const platform = mapPlatformKey(host.split("/")[0] ?? host);
    if (!platform) continue;
    const startsAt = new Date(c.start);
    if (Number.isNaN(startsAt.getTime())) continue;

    out.push({
      platform,
      externalId: String(c.id),
      name: c.event,
      url: c.href,
      startsAt,
      durationSeconds: toSeconds(c.duration, "s"),
      phase: "BEFORE",
    });
  }
  return out;
}

/**
 * Lightweight HTML scrape for HackerRank public contests page.
 * Used when aggregators miss HR events.
 */
export async function scrapeHackerRankContests(): Promise<AggregatedContest[]> {
  try {
    const res = await fetch("https://www.hackerrank.com/domains/tutorials/contests", {
      headers: {
        "User-Agent": UA,
        Accept: "text/html",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();

    // Prefer embedded JSON blobs when present
    const jsonMatch = html.match(
      /<script[^>]*id="initialData"[^>]*>([\s\S]*?)<\/script>/i,
    );
    if (jsonMatch?.[1]) {
      try {
        const data = JSON.parse(jsonMatch[1]) as unknown;
        // Structure varies; soft-fail if unexpected
        void data;
      } catch {
        /* ignore */
      }
    }

    // Fallback: parse contest links + nearby ISO dates from meta/calendar markup
    const out: AggregatedContest[] = [];
    const linkRe =
      /href="(https?:\/\/www\.hackerrank\.com\/contests\/([^"?#]+))"[^>]*>([^<]{3,120})</gi;
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) !== null) {
      const url = m[1]!;
      const slug = m[2]!;
      const name = m[3]!.replace(/\s+/g, " ").trim();
      if (seen.has(slug) || /login|signup|challenge/i.test(slug)) continue;
      seen.add(slug);
      // Without a reliable start time from HTML, skip — aggregator is primary for HR
      void name;
      void url;
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Scrape CodeChef contest list HTML as a soft fallback.
 * Prefer ContestRadar / CodeChef JSON API when available.
 */
export async function scrapeCodeChefContests(): Promise<AggregatedContest[]> {
  try {
    const res = await fetch("https://www.codechef.com/api/list/contests/all", {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      present_contests?: Array<Record<string, string | undefined>>;
      future_contests?: Array<Record<string, string | undefined>>;
    };
    const rows = [
      ...(data.present_contests ?? []),
      ...(data.future_contests ?? []),
    ];
    const now = Date.now() - 3 * 60 * 60 * 1000;
    const out: AggregatedContest[] = [];

    for (const c of rows) {
      const code = c.contest_code;
      const startIso = c.contest_start_date_iso;
      if (!code || !startIso) continue;
      const startsAt = new Date(startIso);
      if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < now) continue;

      let durationSeconds: number | undefined;
      if (c.contest_end_date_iso) {
        const end = new Date(c.contest_end_date_iso);
        if (!Number.isNaN(end.getTime())) {
          durationSeconds = Math.max(
            0,
            Math.round((end.getTime() - startsAt.getTime()) / 1000),
          );
        }
      } else if (c.contest_duration) {
        durationSeconds = Number(c.contest_duration) * 60;
      }

      out.push({
        platform: "codechef",
        externalId: code,
        name: c.contest_name ?? code,
        url: `https://www.codechef.com/${code}`,
        startsAt,
        durationSeconds,
        phase: "BEFORE",
      });
    }
    return out;
  } catch {
    return [];
  }
}

function scoreContest(c: AggregatedContest): number {
  let score = 0;
  if (c.url) score += 2;
  if (c.durationSeconds) score += 1;
  // Prefer official contest codes/slugs over numeric aggregator IDs when possible
  if (/[a-zA-Z]/.test(c.externalId)) score += 2;
  if (c.url && c.url.includes(c.externalId)) score += 2;
  return score;
}

function dedupe(contests: AggregatedContest[]): AggregatedContest[] {
  const byExternal = new Map<string, AggregatedContest>();
  for (const c of contests) {
    const key = `${c.platform}:${c.externalId}`;
    const prev = byExternal.get(key);
    if (!prev || scoreContest(c) > scoreContest(prev)) byExternal.set(key, c);
  }

  // Collapse same platform + name + start (ContestRadar id vs official code)
  const byIdentity = new Map<string, AggregatedContest>();
  for (const c of byExternal.values()) {
    const soft = `${c.platform}:${c.name.trim().toLowerCase()}:${c.startsAt.toISOString()}`;
    const prev = byIdentity.get(soft);
    if (!prev || scoreContest(c) > scoreContest(prev)) byIdentity.set(soft, c);
  }

  return [...byIdentity.values()].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );
}

/**
 * Pull upcoming contests from aggregators + scrapers.
 * Does not call per-platform adapters (those are merged separately).
 */
export async function fetchAggregatedUpcomingContests(): Promise<{
  contests: AggregatedContest[];
  sources: string[];
  errors: string[];
}> {
  const errors: string[] = [];
  const sources: string[] = [];
  const batches: AggregatedContest[][] = [];

  const jobs: Array<{
    name: string;
    run: () => Promise<AggregatedContest[]>;
  }> = [
    { name: "contestradar", run: fetchFromContestRadar },
    { name: "clist", run: fetchFromClist },
    { name: "codechef-api", run: scrapeCodeChefContests },
    { name: "hackerrank-scrape", run: scrapeHackerRankContests },
  ];

  await Promise.all(
    jobs.map(async ({ name, run }) => {
      try {
        const rows = await run();
        if (rows.length > 0) {
          batches.push(rows);
          sources.push(`${name}:${rows.length}`);
        } else if (name === "clist" && (!env.CLIST_API_KEY || !env.CLIST_USERNAME)) {
          // skipped silently when unconfigured
        } else {
          sources.push(`${name}:0`);
        }
      } catch (err) {
        errors.push(
          `${name}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }),
  );

  return {
    contests: dedupe(batches.flat()),
    sources,
    errors,
  };
}
