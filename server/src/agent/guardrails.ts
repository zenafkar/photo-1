import dotenv from 'dotenv';
dotenv.config();

// Simple in-memory rate limiter for specific actions
const actionHistory: Record<string, number[]> = {};

export const guardrails = {
  // Check if feature is enabled in .env
  isFeatureEnabled(featureFlag: string): boolean {
    return process.env[featureFlag] === 'true';
  },

  // Check rate limit for an action
  // maxAttempts in windowMs
  checkRateLimit(actionName: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    if (!actionHistory[actionName]) {
      actionHistory[actionName] = [];
    }
    
    // Clean up old entries
    actionHistory[actionName] = actionHistory[actionName].filter(time => now - time < windowMs);
    
    if (actionHistory[actionName].length >= maxAttempts) {
      return false; // Rate limit exceeded
    }
    
    // Record new attempt
    actionHistory[actionName].push(now);
    return true;
  },
  
  // Sanitize data before sending to external services (e.g. Gemini via SRE agent)
  sanitizeData(data: any): any {
    // Sensitive key name patterns — redact string values whose key matches these.
    // Container values (objects/arrays) under a sensitive key are still recursed into;
    // only leaf string values are redacted by key match.
    const SENSITIVE_KEY_PATTERNS = [
      /password/i, /secret/i, /token/i, /apikey/i, /api[_-]?key/i,
      /private[_-]?key/i, /signing/i,
      /authorization/i, /bearer/i,
      /stack[_-]?trace/i, /error[_-]?message/i, // prevent stack traces / errors leaking to external LLMs
    ];

    // Known secret value prefixes — redact even if the key isn't sensitive
    const SENSITIVE_VALUE_PREFIXES = [
      /^sk_live_/, /^sk_test_/, /^whsec_/, /^github_pat_/,
      /^xnd_/, /^r8_/, /^hf_/, /^AQ\./,
    ];

    const MAX_DEPTH = 20;

    function isSensitiveKey(key: string): boolean {
      return SENSITIVE_KEY_PATTERNS.some(p => p.test(key));
    }

    function isSensitiveValue(value: unknown): boolean {
      if (typeof value !== "string") return false;
      return SENSITIVE_VALUE_PREFIXES.some(p => p.test(value));
    }

    function walk(obj: unknown, depth: number): unknown {
      if (depth > MAX_DEPTH) return "[max-depth]";

      if (obj === null || obj === undefined) return obj;

      // Leaf string — redact if its key (from parent) is sensitive, or the value itself looks secret
      if (typeof obj === "string") {
        return isSensitiveValue(obj) ? "***REDACTED***" : obj;
      }

      if (Array.isArray(obj)) {
        return obj.map((item) => walk(item, depth + 1));
      }

      if (typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
          // Redact leaf string values under sensitive keys
          if (typeof value === "string" && (isSensitiveKey(key) || isSensitiveValue(value))) {
            result[key] = "***REDACTED***";
          } else if (typeof value === "string") {
            result[key] = value; // safe plain string
          } else {
            // Container (object/array) — recurse even if key name is sensitive
            result[key] = walk(value, depth + 1);
          }
        }
        return result;
      }

      return obj;
    }

    return walk(data, 0);
  }
};
