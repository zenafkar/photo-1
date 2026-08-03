import crypto from "node:crypto";

/**
 * Timing-safe comparison of the Xendit callback token.
 * Prevents timing side-channel attacks on the static token.
 */
export function verifyXenditCallback(
  receivedToken: string | undefined,
  storedToken: string,
): boolean {
  if (!receivedToken || !storedToken) return false;
  const bufA = Buffer.from(receivedToken);
  const bufB = Buffer.from(storedToken);
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Strip sensitive fields from a webhook payload before persisting.
 * Uses the same recursive approach as guardrails.sanitizeData.
 */
export function sanitizeWebhookPayload(payload: unknown): unknown {
  const SENSITIVE_FIELDS = new Set([
    "x-callback-token",
    "callback_token",
    "api_key",
    "apikey",
    "authorization",
  ]);

  const MAX_DEPTH = 20;

  function walk(obj: unknown, depth: number): unknown {
    if (depth > MAX_DEPTH) return "[max-depth]";
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => walk(item, depth + 1));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        result[key] = "***REDACTED***";
      } else {
        result[key] = walk(value, depth + 1);
      }
    }
    return result;
  }

  return walk(payload, 0);
}
