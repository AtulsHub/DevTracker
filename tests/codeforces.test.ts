import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sleep so tests don't take 2.1s per call
vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return { ...actual, sleep: vi.fn().mockResolvedValue(undefined) };
});

import { codeforcesAdapter } from "@/server/platforms/codeforces";
import userInfoFixture from "./fixtures/codeforces/user.info.json";
import userStatusFixture from "./fixtures/codeforces/user.status.json";
import userRatingFixture from "./fixtures/codeforces/user.rating.json";

describe("Codeforces Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchProfile", () => {
    it("returns correctly mapped profile data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => userInfoFixture,
      });

      const profile = await codeforcesAdapter.fetchProfile("tourist");

      expect(mockFetch.mock.calls[0][0]).toBe(
        "https://codeforces.com/api/user.info?handles=tourist"
      );
      expect(profile).toEqual({
        handle: "tourist",
        displayName: "Gennady Korotkevich",
        currentRating: 3959,
        maxRating: 4014,
        avatarUrl: "https://userpic.codeforces.org/422/avatar/abc.jpg",
        rank: "tourist",
      });
    });

    it("throws an error when user is not found", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: "FAILED", comment: "handles: User not found" }),
      });

      await expect(codeforcesAdapter.fetchProfile("nonexistent")).rejects.toThrow(
        "CF API error: handles: User not found"
      );
    });
  });

  describe("fetchSubmissions", () => {
    it("returns correctly mapped submissions and skips non-problem ones", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => userStatusFixture,
      });

      const submissions = await codeforcesAdapter.fetchSubmissions("tourist", new Date(0));

      expect(mockFetch.mock.calls[0][0]).toBe(
        "https://codeforces.com/api/user.status?handle=tourist&from=1&count=200"
      );
      
      expect(submissions.length).toBe(2);
      expect(submissions[0].externalSubmissionId).toBe("234567890");
      expect(submissions[0].verdict).toBe("OK");
      
      expect(submissions[1].externalSubmissionId).toBe("234567891");
      expect(submissions[1].verdict).toBe("COMPILATION_ERROR");

      expect(submissions[0].problem.externalId).toBe("4-A");
      expect(submissions[0].problem.title).toBe("Watermelon");
      expect(submissions[0].problem.rating).toBe(800);
      expect(submissions[0].problem.tags).toEqual(["brute force", "math"]);
    });
  });

  describe("verifyOwnership", () => {
    it("returns true when a recent non-OK submission is found for problem 4A", async () => {
      // Mock fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => userStatusFixture,
      });

      // Mock Date.now to be slightly after the fixture's creationTimeSeconds (1700000001)
      const realDateNow = Date.now.bind(global.Date);
      global.Date.now = vi.fn(() => 1700001000 * 1000);

      const isVerified = await codeforcesAdapter.verifyOwnership("tourist", "some-token");
      
      expect(mockFetch.mock.calls[0][0]).toBe(
        "https://codeforces.com/api/user.status?handle=tourist&from=1&count=10"
      );
      expect(isVerified).toBe(true);

      global.Date.now = realDateNow;
    });

    it("returns false if no recent failing submission to 4A is found", async () => {
      // Return empty submissions
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "OK", result: [] }),
      });

      const isVerified = await codeforcesAdapter.verifyOwnership("tourist", "some-token");
      expect(isVerified).toBe(false);
    });
  });
});
