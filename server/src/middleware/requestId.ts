import { randomBytes } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

// Extend Express Locals to include requestId for type safety
declare global {
  namespace Express {
    interface Locals {
      requestId?: string;
    }
  }
}

/**
 * Generate a unique request ID in the format: req_<12 hex chars>
 * Uses crypto.randomBytes for collision resistance.
 * Example: req_a1b2c3d4e5f6
 */
export function generateRequestId(): string {
  return `req_${randomBytes(6).toString("hex")}`;
}

/**
 * Request ID middleware — MUST be mounted first (before telemetry, rate limiters, etc.)
 * so that ALL responses (including 429, 5xx) carry the X-Request-Id header.
 *
 * Behaviour:
 *  1. Generates a unique request ID (req_<12 hex>).
 *  2. Stores it in res.locals.requestId for downstream handlers.
 *  3. Sets the X-Request-Id response header immediately so that even
 *     early-terminating middleware (rate limiters, body-parser errors)
 *     include the header.
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const id = generateRequestId();
  res.locals.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
};
