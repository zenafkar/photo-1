import { Router } from "express";
import { telemetryEmitter } from "../middleware/telemetry";

const router = Router();

router.post("/", (req, res) => {
  // Ingest telemetry payload from client
  const payload = req.body;
  telemetryEmitter.emit("anomaly", payload);
  res.status(200).json({ success: true });
});

export default router;
