import { describe, expect, it } from "vitest";
import { isAuthorizedCronRequest } from "@/server/auth/cron";

describe("isAuthorizedCronRequest", () => {
  it("rejects requests when the secret is not configured", () => {
    const request = new Request("https://example.test/api/cron/daily");

    expect(isAuthorizedCronRequest(request, undefined)).toBe(false);
  });

  it("rejects missing and incorrect authorization headers", () => {
    const missing = new Request("https://example.test/api/cron/daily");
    const incorrect = new Request("https://example.test/api/cron/daily", {
      headers: { authorization: "Bearer wrong-secret" },
    });

    expect(isAuthorizedCronRequest(missing, "correct-secret")).toBe(false);
    expect(isAuthorizedCronRequest(incorrect, "correct-secret")).toBe(false);
  });

  it("accepts the configured bearer secret", () => {
    const request = new Request("https://example.test/api/cron/daily", {
      headers: { authorization: "Bearer correct-secret" },
    });

    expect(isAuthorizedCronRequest(request, "correct-secret")).toBe(true);
  });
});
