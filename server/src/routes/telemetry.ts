import { Router, Request, Response } from "express";
import { telemetryEmitter } from "../middleware/telemetry";

const router = Router();

// Shared secret for client-side telemetry ingestion
const TELEMETRY_SECRET = process.env.TELEMETRY_INGEST_SECRET || "dev-secret-change-in-production";

router.post("/", (req: Request, res: Response) => {
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
