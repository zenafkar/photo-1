import { Router, Request, Response } from "express";
import { z } from "zod";
import { telemetryEmitter } from "../middleware/telemetry";

const router = Router();

// Telemetry payload schema — strict allowlist of known types and bounded field lengths.
// This is the primary defense against prompt injection via forged telemetry.
const TelemetryPayload = z.strictObject({
  type: z.enum([
    "CLIENT_UI_ERROR",
    "API_5XX",
    "API_SLOW",
    "RAM_HIGH",
    "UNHANDLED_PROMISE_REJECTION",
    "UNCAUGHT_EXCEPTION",
  ]),
  errorName: z.string().max(200).optional(),
  errorMessage: z.string().max(1000).optional(),
  stackTrace: z.string().max(8000).optional(),
  componentStack: z.string().max(2000).optional(),
  url: z.string().max(2000).optional(),
  method: z.string().max(10).optional(),
  timestamp: z.string().max(30).optional(),
  userAgent: z.string().max(500).optional(),
});

// Telemetry ingestion is protected by Zod schema validation + IP rate limiting
// (see telemetryLimiter in app.ts). No shared secret is needed — the client bundle
// must never embed server secrets. The schema is the primary defense.
export function validateTelemetryConfig(): void {
  // Telemetry endpoint is self-protecting via schema + rate limiting.
  // This function exists as a no-op for backward compatibility with app.ts startup checks.
}

router.post("/", (req: Request, res: Response) => {
  // Validate payload shape and field lengths before anything else.
  // This prevents malformed or injection-carrying payloads from reaching
  // the AI agent pipeline.
  const parsed = TelemetryPayload.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid telemetry payload",
      issues: parsed.error.issues.map((i) => i.message),
    });
  }

  // Emit only the validated, sanitized payload — never the raw body.
  telemetryEmitter.emit("anomaly", parsed.data);
  res.status(200).json({ success: true });
});

export default router;
