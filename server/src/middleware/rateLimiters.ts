import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { ErrorCodes, sendError } from "./errorContract.js";

/**
 * Shared handler factory for rate-limited (429) responses.
 *
 * Sets the Retry-After header (seconds) so clients know when to back off,
 * then delegates to sendError for a consistent error body:
 *   { success: false, code: "RATE_LIMIT_EXCEEDED", message, request_id }
 *
 * request_id is populated automatically from res.locals by sendError
 * (set by requestIdMiddleware which runs before all rate limiters).
 */
const rateLimitHandler = (message: string, windowMs: number) =>
  function (req: Request, res: Response, _next: any) {
    const retryAfterSeconds = Math.ceil(windowMs / 1000);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return sendError(res, 429, ErrorCodes.RATE_LIMIT_EXCEEDED, message);
  };

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  // Health, webhook, and telegram endpoints have their own dedicated limiters
  // and must not be double-counted against the general budget.
  skip: (req) => {
    const p = req.path;
    return (
      p.startsWith("/api/v1/health") ||
      p.startsWith("/api/v1/webhooks") ||
      p === "/api/v1/internal/telegram-webhook"
    );
  },
  handler: rateLimitHandler(
    "Terlalu banyak permintaan. Silakan coba lagi nanti.",
    15 * 60 * 1000,
  ),
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 generation attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    "Terlalu banyak permintaan generate. Silakan coba lagi nanti.",
    15 * 60 * 1000,
  ),
});

export const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 telemetry events per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    "Terlalu banyak permintaan.",
    60 * 1000,
  ),
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 payment creates per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    "Terlalu banyak permintaan pembayaran. Silakan coba lagi nanti.",
    60 * 1000,
  ),
});

export const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 health checks per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    "Terlalu banyak permintaan health check. Silakan coba lagi nanti.",
    60 * 1000,
  ),
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 webhook events per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    "Terlalu banyak permintaan webhook. Silakan coba lagi nanti.",
    60 * 1000,
  ),
});
