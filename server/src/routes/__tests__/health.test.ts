import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock Clerk — prevents "Publishable key not valid" crash on CI
vi.mock("@clerk/express", () => ({
  getAuth: vi.fn(),
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

import { createApp } from "../../app.js";

const app = createApp();

describe("Health Routes", () => {
  it("GET /api/v1/health returns 200 with success and timestamp", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("healthy");
    expect(res.body.timestamp).toBeDefined();
  });

  it("GET /api/v1/health/auth-debug returns debug info", async () => {
    const res = await request(app).get("/api/v1/health/auth-debug");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("hasAuthHeader");
  });

  it("health routes are publicly accessible (no auth required)", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
  });

  it("exposes public liveness and readiness probes", async () => {
    const live = await request(app).get("/api/v1/health/live");
    expect(live.status).toBe(200);
    expect(live.body.status).toBe("alive");

    const ready = await request(app).get("/api/v1/health/ready");
    expect([200, 503]).toContain(ready.status);
    expect(ready.body).toHaveProperty("timestamp");
  });
});
