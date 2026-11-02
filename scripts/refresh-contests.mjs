/**
 * One-shot: pull aggregators into the DB.
 * Usage: node --env-file=.env.local --import tsx scripts/refresh-contests.mjs
 */
import { refreshContestsFromAdapters } from "../src/server/services/contests.ts";

const result = await refreshContestsFromAdapters();
console.log(JSON.stringify(result, null, 2));
