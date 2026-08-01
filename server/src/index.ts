import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";
import compression from "compression";
import helmet from "helmet";

// Fix for Node.js fetch DNS resolution ENOTFOUND error on some Windows networks
dns.setDefaultResultOrder("ipv4first");
import { clerkMiddleware } from "@clerk/express";
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import healthRoutes from "./routes/health";
import userRoutes from "./routes/user";
import generateRoutes from "./routes/generate";

import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(cors({ origin: "*" })); // Configure this to frontend URL in production
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(clerkMiddleware()); // Required by @clerk/express before requireAuth

// Serve static uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Public Routes
app.use("/api/v1/health", healthRoutes);

// Protected Routes (Require Clerk Auth)
app.use("/api/v1/user", requireAuth, userRoutes);
app.use("/api/v1/generate", requireAuth, generateRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
