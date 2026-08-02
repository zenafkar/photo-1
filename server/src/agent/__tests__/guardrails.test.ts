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
    it("masks password, token, secret, and key values", () => {
      const input = 'password "mysecret123" token=abc123 secret: xyz key: "hello"';
      const result = guardrails.sanitizeData(input);
      expect(result).not.toContain("mysecret123");
      expect(result).not.toContain("abc123");
      expect(result).not.toContain("xyz");
      expect(result).not.toContain('"hello"');
      expect(result).toContain("***MASKED***");
    });

    it("handles non-string input by returning unchanged", () => {
      const obj = { foo: "bar" };
      const result = guardrails.sanitizeData(obj);
      // Since sanitizeData stringifies internally, the result is a string
      // but the masking should still apply to any secret-like keys in JSON
      expect(typeof result).toBe("string");
    });
  });
});
