import { fetchAggregatedUpcomingContests } from "../src/server/services/contest-aggregator.ts";

const r = await fetchAggregatedUpcomingContests();
console.log(
  JSON.stringify(
    {
      count: r.contests.length,
      sources: r.sources,
      errors: r.errors,
      byPlatform: r.contests.reduce((acc, c) => {
        acc[c.platform] = (acc[c.platform] ?? 0) + 1;
        return acc;
      }, {}),
      sample: r.contests.slice(0, 5).map((c) => ({
        p: c.platform,
        n: c.name,
        t: c.startsAt,
      })),
    },
    null,
    2,
  ),
);
