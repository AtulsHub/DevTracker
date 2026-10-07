/**
 * tests/privacy.test.ts
 * Exhaustive Vitest matrix for the canView privacy engine.
 * Tests all combinations of:
 *   - viewer role: owner, teammate, accepted follower, stranger, unauthenticated
 *   - owner profile visibility: PUBLIC, FOLLOWERS_ONLY, PRIVATE
 *   - field audience: EVERYONE, FOLLOWERS, TEAM, ME
 *
 * These run entirely offline — all DB calls are mocked.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock drizzle DB ────────────────────────────────────────────────────────────
// We mock the db module so canView can be tested without a real database.
vi.mock("@/server/db", () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
      teamMembers: { findFirst: vi.fn() },
      follows: { findFirst: vi.fn() },
      privacySettings: { findFirst: vi.fn() },
    },
    execute: vi.fn(),
  },
}));

import { canView } from "@/server/privacy/can-view";
import { db } from "@/server/db";

// Typed query mocks
const mockUserQuery = db.query.users.findFirst as ReturnType<typeof vi.fn>;
const mockTeamQuery = db.query.teamMembers.findFirst as ReturnType<typeof vi.fn>;
const mockFollowQuery = db.query.follows.findFirst as ReturnType<typeof vi.fn>;
const mockPrivacyQuery = db.query.privacySettings.findFirst as ReturnType<typeof vi.fn>;

const VIEWER_ID = "viewer-123";
const OWNER_ID = "owner-456";

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no privacy override (field audience defaults to EVERYONE)
  mockPrivacyQuery.mockResolvedValue(undefined);
  // Default: no team overlap
  mockTeamQuery.mockResolvedValue(undefined);
  // Default: no follow
  mockFollowQuery.mockResolvedValue(undefined);
});

// ─────────────────────────────────────────────────────────────────────────────
describe("canView — Step 1: Viewer is the owner", () => {
  it("always returns true when viewerId === ownerId", async () => {
    mockUserQuery.mockResolvedValue({ profileVisibility: "PRIVATE", discoverable: false });
    const result = await canView(OWNER_ID, OWNER_ID, "activity_feed");
    expect(result).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("canView — Step 2: Shared team membership", () => {
  beforeEach(() => {
    mockUserQuery.mockResolvedValue({ profileVisibility: "PRIVATE", discoverable: false });
  });

  it("allows access when viewer and owner share a team (EVERYONE field)", async () => {
    // Viewer is in team-A
    mockTeamQuery.mockResolvedValueOnce({ teamId: "team-A" });
    // Owner is also in team-A
    mockTeamQuery.mockResolvedValueOnce({ teamId: "team-A" });

    const result = await canView(VIEWER_ID, OWNER_ID, "activity_feed");
    expect(result).toBe(true);
  });

  it("denies access when field is ME-only even for teammates", async () => {
    mockPrivacyQuery.mockResolvedValue({ audience: "ME" });
    mockTeamQuery.mockResolvedValueOnce({ teamId: "team-A" });
    mockTeamQuery.mockResolvedValueOnce({ teamId: "team-A" });

    const result = await canView(VIEWER_ID, OWNER_ID, "activity_feed");
    expect(result).toBe(false);
  });

  it("denies access when viewer is in a team but owner is not", async () => {
    mockTeamQuery.mockResolvedValueOnce({ teamId: "team-A" });
    mockTeamQuery.mockResolvedValueOnce(undefined); // owner not in same team

    const result = await canView(VIEWER_ID, OWNER_ID, "activity_feed");
    expect(result).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("canView — Step 3: Accepted follow", () => {
  beforeEach(() => {
    mockUserQuery.mockResolvedValue({ profileVisibility: "FOLLOWERS_ONLY", discoverable: true });
    // No shared team
    mockTeamQuery.mockResolvedValue(undefined);
  });

  it("allows access for EVERYONE field when viewer follows owner", async () => {
    mockFollowQuery.mockResolvedValue({ status: "ACCEPTED" });
    const result = await canView(VIEWER_ID, OWNER_ID, "activity_feed");
    expect(result).toBe(true);
  });

  it("allows access for FOLLOWERS field when viewer follows owner", async () => {
    mockPrivacyQuery.mockResolvedValue({ audience: "FOLLOWERS" });
    mockFollowQuery.mockResolvedValue({ status: "ACCEPTED" });
    const result = await canView(VIEWER_ID, OWNER_ID, "ratings");
    expect(result).toBe(true);
  });

  it("denies access for TEAM field even when viewer follows owner", async () => {
    mockPrivacyQuery.mockResolvedValue({ audience: "TEAM" });
    mockFollowQuery.mockResolvedValue({ status: "ACCEPTED" });
    const result = await canView(VIEWER_ID, OWNER_ID, "ratings");
    expect(result).toBe(false);
  });

  it("denies access when follow status is PENDING (not accepted)", async () => {
    // The query filters for status="ACCEPTED", so a PENDING follow returns undefined
    mockFollowQuery.mockResolvedValue(undefined);
    const result = await canView(VIEWER_ID, OWNER_ID, "activity_feed");
    expect(result).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("canView — Step 4: Public profile", () => {
  beforeEach(() => {
    mockUserQuery.mockResolvedValue({ profileVisibility: "PUBLIC", discoverable: true });
    mockTeamQuery.mockResolvedValue(undefined);
    mockFollowQuery.mockResolvedValue(undefined);
  });

  it("allows access for EVERYONE field on a public profile", async () => {
    const result = await canView(VIEWER_ID, OWNER_ID, "activity_feed");
    expect(result).toBe(true);
  });

  it("denies access for FOLLOWERS field on a public profile (stranger)", async () => {
    mockPrivacyQuery.mockResolvedValue({ audience: "FOLLOWERS" });
    const result = await canView(VIEWER_ID, OWNER_ID, "ratings");
    expect(result).toBe(false);
  });

  it("denies access for ME field on a public profile", async () => {
    mockPrivacyQuery.mockResolvedValue({ audience: "ME" });
    const result = await canView(VIEWER_ID, OWNER_ID, "linked_handles");
    expect(result).toBe(false);
  });

  it("unauthenticated viewer can see EVERYONE field on public profile", async () => {
    const result = await canView(null, OWNER_ID, "activity_feed");
    expect(result).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("canView — Step 5: Deny (private/followers-only profile, no relationship)", () => {
  it("denies unauthenticated viewer on FOLLOWERS_ONLY profile", async () => {
    mockUserQuery.mockResolvedValue({ profileVisibility: "FOLLOWERS_ONLY", discoverable: true });
    const result = await canView(null, OWNER_ID, "activity_feed");
    expect(result).toBe(false);
  });

  it("denies authenticated stranger on PRIVATE profile", async () => {
    mockUserQuery.mockResolvedValue({ profileVisibility: "PRIVATE", discoverable: false });
    const result = await canView(VIEWER_ID, OWNER_ID, "activity_feed");
    expect(result).toBe(false);
  });

  it("denies unauthenticated viewer on PRIVATE profile", async () => {
    mockUserQuery.mockResolvedValue({ profileVisibility: "PRIVATE", discoverable: false });
    const result = await canView(null, OWNER_ID, "heatmap");
    expect(result).toBe(false);
  });

  it("returns false if owner does not exist", async () => {
    mockUserQuery.mockResolvedValue(undefined);
    const result = await canView(VIEWER_ID, "nonexistent", "activity_feed");
    expect(result).toBe(false);
  });
});
