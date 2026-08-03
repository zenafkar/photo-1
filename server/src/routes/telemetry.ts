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

// Shared secret for server-side telemetry ingestion (not embedded in client bundles).
// Evaluated lazily so tests can inject the env var after module import.
function getTelemetrySecret(): string {
  return process.env.TELEMETRY_INGEST_SECRET || "";
}

export function validateTelemetryConfig(): void {
  if (!getTelemetrySecret()) {
    throw new Error(
      "TELEMETRY_INGEST_SECRET is not set. " +
      "This is required for telemetry endpoint authentication. " +
      "Set it in your environment variables and restart the server."
    );
  }
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
