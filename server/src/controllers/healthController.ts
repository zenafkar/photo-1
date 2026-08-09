import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { isDatabaseUnavailable, prisma } from "../config/prisma.js";

async function checkDatabase(timeoutMs = 3000): Promise<number> {
  const startedAt = Date.now();
  await Promise.race([
    prisma.$queryRawUnsafe("SELECT 1"),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Database readiness timeout")), timeoutMs)),
  ]);
  return Date.now() - startedAt;
}

export const getHealth = async (req: Request, res: Response) => {
  let dbStatus = "unknown";
  let dbLatencyMs: number | null = null;
  try {
    dbLatencyMs = await checkDatabase();
    dbStatus = "ok";
  } catch {
    dbStatus = "degraded";
  }

  res.status(200).json({
    success: true,
    message: "Server is healthy and running",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    databaseLatencyMs: dbLatencyMs,
  });
};

export const getLiveness = (_req: Request, res: Response) => {
  res.status(200).json({ success: true, status: "alive", timestamp: new Date().toISOString() });
};

export const getReadiness = async (_req: Request, res: Response) => {
  try {
    const databaseLatencyMs = await checkDatabase();
    return res.status(200).json({
      success: true,
      status: "ready",
      database: "ok",
      databaseLatencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const databaseError = isDatabaseUnavailable(error) || error instanceof Error;
    res.setHeader("Retry-After", "5");
    return res.status(503).json({
      success: false,
      status: "not_ready",
      database: databaseError ? "unavailable" : "unknown",
      code: "DATABASE_UNAVAILABLE",
      retryable: true,
      retryAfter: 5,
      timestamp: new Date().toISOString(),
    });
  }
};

export const getAuthDebug = (req: Request, res: Response) => {
  try {
    const auth = getAuth(req);
    const authHeader = req.headers.authorization;
    res.json({
      success: true,
      auth: auth,
      hasAuthHeader: !!authHeader,
      headerLength: authHeader?.length || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
