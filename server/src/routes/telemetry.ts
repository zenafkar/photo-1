import { Router, Request, Response } from "express";
import { telemetryEmitter } from "../middleware/telemetry";

const router = Router();

// Shared secret for client-side telemetry ingestion
// Evaluated lazily so tests can inject the env var after module import
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
  const TELEMETRY_SECRET = getTelemetrySecret();

  // Refuse to operate if the secret was never configured (safety net)
  if (!TELEMETRY_SECRET) {
    return res.status(500).json({ success: false, message: "Server misconfiguration: telemetry secret not set" });
  }

  // Require a shared secret to prevent unauthorized telemetry injection
  const authHeader = req.headers.authorization || "";
  const secretFromQuery = req.query.secret as string | undefined;
  const providedSecret = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : secretFromQuery || "";

  if (providedSecret !== TELEMETRY_SECRET) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Ingest telemetry payload from client (ErrorBoundary only)
  const payload = req.body;
  telemetryEmitter.emit("anomaly", payload);
  res.status(200).json({ success: true });
});

export default router;
