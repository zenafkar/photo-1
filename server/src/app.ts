import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Fix for Node.js fetch DNS resolution ENOTFOUND error on some Windows networks
dns.setDefaultResultOrder("ipv4first");

import { clerkMiddleware } from "@clerk/express";
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import healthRoutes from "./routes/health";
import userRoutes from "./routes/user";
import userEventsRoutes from "./routes/userEvents.js";
import generateRoutes from "./routes/generate";
import webhookRoutes from "./routes/webhooks.js";
import telemetryRoutes from "./routes/telemetry.js";
import paymentsRoutes from "./routes/payments.js";
import { telemetryMiddleware, telemetryErrorHandler } from "./middleware/telemetry.js";
import { validateTelemetryConfig } from "./routes/telemetry.js";
import path from "path";

dotenv.config();

import { generalLimiter, strictLimiter, telemetryLimiter, paymentLimiter } from "./middleware/rateLimiters.js";

export function createApp() {
  const app = express();

  // Trust proxy for accurate client IP behind nginx
  app.set("trust proxy", 1);

  // Fail-fast on missing required secrets in production
  if (process.env.NODE_ENV === "production") {
    validateTelemetryConfig();
  }

  // Middleware
  app.use(telemetryMiddleware); // Run first to catch all requests for latency
  app.use(generalLimiter); // Global rate limit
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(compression());
  app.use(cors({
    origin: [
      "https://zenstudio.my.id",
      ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://localhost:3000"] : []),
    ],
    credentials: true,
  }));
  // Route-specific body parser: allow large 50mb payloads only on /generate
  // Registered before the global parser so it takes precedence for matching routes
  app.use("/api/v1/generate", express.json({ limit: "50mb" }));

  // Webhook body parser: capture raw body for Svix signature verification.
  // Scoped to webhook routes only — other routes do NOT need rawBody.
  app.use("/api/v1/webhooks", express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString("utf8");
    },
  }));

  // Global body parser: 1mb default for all other routes
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  app.use(clerkMiddleware()); // Required by @clerk/express before requireAuth

  // Serve static uploaded files (under /api/v1 so Nginx proxies it properly in production)
  app.use("/api/v1/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Public Routes
  app.use("/api/v1/health", healthRoutes);
  app.use("/api/v1/webhooks", webhookRoutes);
  app.use("/api/v1/telemetry", telemetryLimiter, telemetryRoutes);
  // SSE authenticates with a short-lived ticket, so only ticket creation is protected.
  app.use("/api/v1/user/events", userEventsRoutes);

  // Protected Routes (Require Clerk Auth) — with stricter rate limits
  app.use("/api/v1/user", requireAuth, userRoutes);
  app.use("/api/v1/generate", requireAuth, strictLimiter, generateRoutes);
  app.use("/api/v1/payments", requireAuth, paymentLimiter, paymentsRoutes);

  // Global Error Handler
  app.use(telemetryErrorHandler); // Added telemetry error catcher
  app.use(errorHandler);

  return app;
}
