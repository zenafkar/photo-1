import { describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }));

vi.mock("../../config/prisma.js", () => ({
  prisma: { $queryRawUnsafe: queryRaw },
  isDatabaseUnavailable: () => true,
}));

vi.mock("@clerk/express", () => ({
  getAuth: vi.fn(),
}));

import healthRoutes from "../health.js";

const app = express();
app.use("/health", healthRoutes);

describe("health route contract", () => {
  it("keeps liveness independent from database availability", async () => {
    const res = await request(app).get("/health/live");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: "alive" });
    expect(res.body.timestamp).toEqual(expect.any(String));
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("returns the documented retryable 503 readiness contract on DB failure", async () => {
    queryRaw.mockRejectedValueOnce(new Error("database offline"));

    const res = await request(app).get("/health/ready");

    expect(res.status).toBe(503);
    expect(res.headers["retry-after"]).toBe("5");
    expect(res.body).toMatchObject({
      success: false,
      status: "not_ready",
      database: "unavailable",
      code: "DATABASE_UNAVAILABLE",
      retryable: true,
      retryAfter: 5,
    });
    expect(res.body.timestamp).toEqual(expect.any(String));
  });
});
