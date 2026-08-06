import { Router } from "express";
import { getHealth, getAuthDebug } from "../controllers/healthController.js";

const router = Router();

router.get("/", getHealth);

// Auth debug endpoint — only available in development for security
if (process.env.NODE_ENV !== "production") {
  router.get("/auth-debug", getAuthDebug);
}

export default router;
