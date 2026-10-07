/**
 * src/server/platforms/types.ts
 * Shared interface and normalized types for all platform adapters.
 * See docs/SPEC.md section 7 for the adapter interface specification.
 */

/** Supported platform identifiers. */
export type PlatformId =
  | "codeforces"
  | "leetcode"
  | "atcoder"
  | "codechef"
  | "hackerrank"
  | "hackerearth"
  | "cses"
  | "kattis";

/** Normalized verdict mapping across all platforms. */
export type Verdict =
  | "OK"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "PARTIAL"
  | "OTHER";

/** Normalized contest phase. */
export type ContestPhase =
  | "BEFORE"
  | "CODING"
  | "PENDING_SYSTEM_TEST"
  | "SYSTEM_TEST"
  | "FINISHED";

/** Snapshot of a user's profile on a platform. */
export interface ProfileSnapshot {
  handle: string;
  displayName?: string;
  currentRating?: number;
  maxRating?: number;
  rank?: string;
  avatarUrl?: string;
  solvedCount?: number;
}

/** A single normalized submission record. */
export interface NormalizedSubmission {
  externalSubmissionId: string;
  problem: {
    externalId: string;
    title: string;
    url?: string;
    difficultyLabel?: string; // e.g. 'Easy', 'Medium'
    rating?: number;          // e.g. CF rating 1500
    tags?: string[];
  };
  verdict: Verdict;
  language?: string;
  submittedAt: Date;
  isContest: boolean;
  contestId?: string;
}

/** A normalized contest participation result. */
export interface NormalizedContestResult {
  contest: {
    externalId: string;
    name: string;
    url?: string;
    startsAt: Date;
    durationSeconds?: number;
    type?: string;
  };
  rank?: number;
  ratingBefore?: number;
  ratingAfter?: number;
  solvedCount?: number;
  participatedAt?: Date;
}

/** A normalized upcoming contest. */
export interface NormalizedContest {
  externalId: string;
  name: string;
  url?: string;
  startsAt: Date;
  durationSeconds?: number;
  type?: string;
  phase: ContestPhase;
}

/**
 * The platform adapter interface.
 * Every platform integration must implement this.
 */
export interface PlatformAdapter {
  /** Unique identifier for this platform. */
  id: PlatformId;

  /**
   * Verify that the given handle belongs to the user proving it.
   * Each platform uses a different verification method (see spec section 7.x).
   * @param handle - The platform username
   * @param token - The verification token generated for the user
   * @returns true if verified, false if not yet verified
   */
  verifyOwnership(handle: string, token: string): Promise<boolean>;

  /**
   * Fetch current profile stats for a handle.
   */
  fetchProfile(handle: string): Promise<ProfileSnapshot>;

  /**
   * Fetch accepted and non-accepted submissions since the given date.
   * Must be idempotent and deduplicated by externalSubmissionId.
   * @param handle - The platform username
   * @param since - Fetch submissions after this timestamp
   */
  fetchSubmissions(
    handle: string,
    since: Date
  ): Promise<NormalizedSubmission[]>;

  /**
   * Fetch the user's full contest participation history.
   */
  fetchContestHistory(handle: string): Promise<NormalizedContestResult[]>;

  /**
   * Fetch upcoming contests on this platform.
   */
  fetchUpcomingContests(): Promise<NormalizedContest[]>;
}

/** Result wrapper for adapter calls that may degrade gracefully. */
export type AdapterResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; degraded: boolean };
