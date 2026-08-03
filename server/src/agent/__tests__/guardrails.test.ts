import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { guardrails } from "../guardrails.js";

describe("guardrails", () => {
  describe("isFeatureEnabled", () => {
    it("returns true when env var is 'true'", () => {
      process.env.TEST_FEATURE = "true";
      expect(guardrails.isFeatureEnabled("TEST_FEATURE")).toBe(true);
      delete process.env.TEST_FEATURE;
    });

    it("returns false when env var is not 'true'", () => {
      process.env.TEST_FEATURE = "false";
      expect(guardrails.isFeatureEnabled("TEST_FEATURE")).toBe(false);
      delete process.env.TEST_FEATURE;
    });

    it("returns false when env var is not set", () => {
      delete process.env.NONEXISTENT_FEATURE;
      expect(guardrails.isFeatureEnabled("NONEXISTENT_FEATURE")).toBe(false);
    });
  });

  describe("checkRateLimit", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("allows calls within the limit", () => {
      expect(guardrails.checkRateLimit("test-action", 3, 60_000)).toBe(true);
      expect(guardrails.checkRateLimit("test-action", 3, 60_000)).toBe(true);
      expect(guardrails.checkRateLimit("test-action", 3, 60_000)).toBe(true);
    });

    it("blocks after maxAttempts exceeded", () => {
      expect(guardrails.checkRateLimit("block-action", 2, 60_000)).toBe(true);
      expect(guardrails.checkRateLimit("block-action", 2, 60_000)).toBe(true);
      expect(guardrails.checkRateLimit("block-action", 2, 60_000)).toBe(false);
    });

    it("evicts expired timestamps and allows new calls", () => {
      // Use up all attempts
      expect(guardrails.checkRateLimit("expire-action", 2, 60_000)).toBe(true);
      expect(guardrails.checkRateLimit("expire-action", 2, 60_000)).toBe(true);
      expect(guardrails.checkRateLimit("expire-action", 2, 60_000)).toBe(false);

      // Advance past the window
      vi.advanceTimersByTime(61_000);

      // Should allow again
      expect(guardrails.checkRateLimit("expire-action", 2, 60_000)).toBe(true);
    });
  });

  describe("sanitizeData", () => {
    it("redacts values for sensitive keys (password, secret, token, apiKey, auth)", () => {
      const input = {
        username: "testuser",
        password: "mysecret123",
        apiKey: "sk_live_abc123",
        token: "bearer-token-xyz",
        secret: "super-secret-value",
        nested: {
          Authorization: "Bearer eyJhbGciOi...",
          data: "safe-data",
        },
      };
      const result = guardrails.sanitizeData(input);
      expect(result.password).toBe("***REDACTED***");
      expect(result.apiKey).toBe("***REDACTED***");
      expect(result.token).toBe("***REDACTED***");
      expect(result.secret).toBe("***REDACTED***");
      expect(result.nested.Authorization).toBe("***REDACTED***");
      expect(result.username).toBe("testuser");
      expect(result.nested.data).toBe("safe-data");
    });

    it("redacts string values matching known secret prefixes", () => {
      const input = {
        service: "analytics",
        key: "sk_live_fakeTestKey123abc",
        webhook: "whsec_fakeWebhookSecret456",
        gh: "github_pat_fakePatToken789",
        message: "this is safe text",
      };
      const result = guardrails.sanitizeData(input);
      expect(result.key).toBe("***REDACTED***");
      expect(result.webhook).toBe("***REDACTED***");
      expect(result.gh).toBe("***REDACTED***");
      expect(result.service).toBe("analytics");
      expect(result.message).toBe("this is safe text");
    });

    it("handles arrays and nested structures", () => {
      const input = {
        items: [
          { name: "item1", token: "secret-a" },
          { name: "item2", token: "secret-b" },
        ],
        meta: {
          credentials: [{ api_key: "hidden-value" }],
        },
      };
      const result = guardrails.sanitizeData(input);
      expect(result.items[0].token).toBe("***REDACTED***");
      expect(result.items[1].token).toBe("***REDACTED***");
      expect(result.items[0].name).toBe("item1");
      expect(result.meta.credentials[0].api_key).toBe("***REDACTED***");
    });

    it("returns primitives unchanged", () => {
      expect(guardrails.sanitizeData(null)).toBe(null);
      expect(guardrails.sanitizeData(42)).toBe(42);
      expect(guardrails.sanitizeData("plain string")).toBe("plain string");
      expect(guardrails.sanitizeData(true)).toBe(true);
    });

    it("handles depth limit to prevent stack overflow", () => {
      // Build a deeply nested object (25 levels deep)
      let deep: any = { value: "safe" };
      for (let i = 0; i < 25; i++) {
        deep = { nested: deep };
      }
      const result = guardrails.sanitizeData(deep);
      // Should not throw — max-depth marker present somewhere deep
      let current = result;
      let foundMaxDepth = false;
      for (let i = 0; i < 25; i++) {
        if (current.nested === "[max-depth]") {
          foundMaxDepth = true;
          break;
        }
        current = current.nested;
      }
      expect(foundMaxDepth).toBe(true);
    });
  });
});
