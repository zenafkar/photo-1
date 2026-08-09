import { Router } from "express";
import { getHealth, getAuthDebug, getLiveness, getReadiness } from "../controllers/healthController.js";

const router = Router();

// Probe endpoints stay public and are registered explicitly for the gateway.
router.get("/live", getLiveness);
router.get("/ready", getReadiness);
router.get("/", getHealth);

// Auth debug endpoint — only available in development for security
if (process.env.NODE_ENV !== "production") {
  router.get("/auth-debug", getAuthDebug);
}

export default router;
