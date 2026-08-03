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
import generateRoutes from "./routes/generate";
import webhookRoutes from "./routes/webhooks.js";
import telemetryRoutes from "./routes/telemetry.js";
import paymentsRoutes from "./routes/payments.js";
import { telemetryMiddleware, telemetryErrorHandler } from "./middleware/telemetry.js";
import { validateTelemetryConfig } from "./routes/telemetry.js";
import path from "path";

dotenv.config();

// Rate limiter factories for different protection levels
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 generation attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak permintaan generate. Silakan coba lagi nanti." },
});

const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 telemetry events per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak permintaan." },
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 payment creates per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak permintaan pembayaran. Silakan coba lagi nanti." },
});

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

  // Global body parser: 1mb default for all other routes
  app.use(express.json({
    limit: "1mb",
    // Preserve raw body for webhook signature verification (svix)
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString("utf8");
    },
  }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  app.use(clerkMiddleware()); // Required by @clerk/express before requireAuth

  // Serve static uploaded files (under /api/v1 so Nginx proxies it properly in production)
  app.use("/api/v1/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Public Routes
  app.use("/api/v1/health", healthRoutes);
  app.use("/api/v1/webhooks", webhookRoutes);
  app.use("/api/v1/telemetry", telemetryLimiter, telemetryRoutes);

  // Protected Routes (Require Clerk Auth) — with stricter rate limits
  app.use("/api/v1/user", requireAuth, userRoutes);
  app.use("/api/v1/generate", requireAuth, strictLimiter, generateRoutes);
  app.use("/api/v1/payments", requireAuth, paymentLimiter, paymentsRoutes);

  // Global Error Handler
  app.use(telemetryErrorHandler); // Added telemetry error catcher
  app.use(errorHandler);

  return app;
}
