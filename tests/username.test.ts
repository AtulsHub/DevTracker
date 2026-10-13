import { describe, it, expect } from "vitest";
import { validateUsername } from "@/lib/username";

describe("validateUsername", () => {
  it("accepts valid usernames", () => {
    expect(validateUsername("alice").ok).toBe(true);
    expect(validateUsername("bob_123").username).toBe("bob_123");
  });

  it("normalizes case", () => {
    expect(validateUsername("Alice").username).toBe("alice");
  });

  it("rejects short or invalid", () => {
    expect(validateUsername("ab").ok).toBe(false);
    expect(validateUsername("bad-name").ok).toBe(false);
    expect(validateUsername("has space").ok).toBe(false);
  });

  it("rejects reserved", () => {
    expect(validateUsername("admin").ok).toBe(false);
    expect(validateUsername("dashboard").ok).toBe(false);
  });
});
