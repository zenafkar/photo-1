import { Request, Response, NextFunction } from "express";
import { triggerAgentCheck } from "../agent/agent";

export interface TelemetryPayload {
  timestamp: string;
  type: "SERVER_ERROR" | "LATENCY_WARNING" | "UNHANDLED_REJECTION" | "CLIENT_UI_CRASH";
  route: string;
  method: string;
  statusCode?: number;
  message: string;
  stackTrace?: string;
  durationMs?: number;
  payload?: any;
}

// In-memory telemetry buffer for spike detection
const recentTelemetryEvents: TelemetryPayload[] = [];

export const getRecentTelemetryEvents = (): TelemetryPayload[] => {
  return recentTelemetryEvents;
};

export const recordTelemetryEvent = (event: TelemetryPayload) => {
  recentTelemetryEvents.push(event);
  // Keep only the last 100 events to prevent memory leaks
  if (recentTelemetryEvents.length > 100) {
    recentTelemetryEvents.shift();
  }

  // Trigger agent evaluation for critical events
  if (event.type === "SERVER_ERROR" || event.type === "CLIENT_UI_CRASH" || (event.statusCode && event.statusCode >= 500)) {
    triggerAgentCheck(event).catch((err) => {
      console.error("[Telemetry]: Agent trigger failed:", err);
    });
  }
};

/**
 * Express Middleware to track latency and capture 5xx errors automatically
 */
export const telemetryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;

    // Latency Warning (> 2000ms)
    if (durationMs > 2000) {
      recordTelemetryEvent({
        timestamp: new Date().toISOString(),
        type: "LATENCY_WARNING",
        route: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        message: `High latency detected: ${durationMs}ms on ${req.method} ${req.originalUrl}`,
        durationMs,
      });
    }

    // 5xx Server Error Event
    if (res.statusCode >= 500) {
      recordTelemetryEvent({
        timestamp: new Date().toISOString(),
        type: "SERVER_ERROR",
        route: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        message: `Server returned HTTP ${res.statusCode} on ${req.method} ${req.originalUrl}`,
        durationMs,
      });
    }
  });

  next();
};

/**
 * Listen for uncaught exceptions and unhandled rejections in Node.js
 */
process.on("unhandledRejection", (reason: any) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stackTrace = reason instanceof Error ? reason.stack : undefined;
  
  console.error("[Telemetry] Unhandled Promise Rejection:", message);
  recordTelemetryEvent({
    timestamp: new Date().toISOString(),
    type: "UNHANDLED_REJECTION",
    route: "SYSTEM_PROCESS",
    method: "BACKGROUND",
    message: `Unhandled Promise Rejection: ${message}`,
    stackTrace,
  });
});
