import type { Request } from "express";

// ── Error Code Constants ──────────────────────────────────────
// Machine-readable error codes for client consumption.
// Keep in SCREAMING_SNAKE_CASE for consistency.
export const ErrorCodes = {
  // Auth / access
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  USER_NOT_FOUND: "USER_NOT_FOUND",

  // Validation / payload
  INVALID_PAYLOAD: "INVALID_PAYLOAD",
  INVALID_IDEMPOTENCY_KEY: "INVALID_IDEMPOTENCY_KEY",
  IDEMPOTENCY_KEY_REUSED: "IDEMPOTENCY_KEY_REUSED",
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",

  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Resource not found
  PAYMENT_NOT_FOUND: "PAYMENT_NOT_FOUND",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  GENERATION_NOT_FOUND: "GENERATION_NOT_FOUND",

  // Infrastructure
  DATABASE_UNAVAILABLE: "DATABASE_UNAVAILABLE",
  UPSTREAM_UNAVAILABLE: "UPSTREAM_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",

  // Webhooks
  WEBHOOK_ACKED_DEFERRED: "WEBHOOK_ACKED_DEFERRED",
  WEBHOOK_SIGNATURE_INVALID: "WEBHOOK_SIGNATURE_INVALID",
  WEBHOOK_SECRET_MISSING: "WEBHOOK_SECRET_MISSING",

  // Generation
  GENERATION_OUTCOME_UNKNOWN: "GENERATION_OUTCOME_UNKNOWN",
  GENERATION_FAILED: "GENERATION_FAILED",

  // Payments
  PAYMENT_AMOUNT_MISMATCH: "PAYMENT_AMOUNT_MISMATCH",
  PAYMENT_CURRENCY_INVALID: "PAYMENT_CURRENCY_INVALID",
  PAYMENT_ALREADY_SETTLED: "PAYMENT_ALREADY_SETTLED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ── Error body shape ──────────────────────────────────────────
export interface ErrorBody {
  success: false;
  code: string;
  message: string;
  details?: unknown;
  request_id?: string;
}

/**
 * Build a standardised error response body.
 *
 * @param code     Machine-readable error code (use ErrorCodes constants).
 * @param message  Human-readable message (may be locale-specific).
 * @param details  Optional extra context (validation issues, field errors, etc.).
 * @param req      Express request — used to extract request_id from res.locals.
 */
export function errorBody(
  code: string,
  message: string,
  details?: unknown,
  req?: Pick<Request, "res"> | { res?: { locals?: { requestId?: string } } },
): ErrorBody {
  const body: ErrorBody = {
    success: false,
    code,
    message,
  };
  if (details !== undefined) {
    body.details = details;
  }
  // Extract request_id from res.locals if available
  const requestId = (req as any)?.res?.locals?.requestId;
  if (requestId) {
    body.request_id = requestId;
  }
  return body;
}

/**
 * Helper: send a standardised error JSON response.
 * Sets status code and writes the error body in one call.
 */
export function sendError(
  res: { status: (code: number) => any; locals?: { requestId?: string } },
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) {
  const body: ErrorBody = {
    success: false,
    code,
    message,
  };
  if (details !== undefined) {
    body.details = details;
  }
  if (res.locals?.requestId) {
    body.request_id = res.locals.requestId;
  }
  return res.status(statusCode).json(body);
}
