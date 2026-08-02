import { describe, it, expect } from "vitest";
import request from "supertest";
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

  it("GET /api/v1/health/auth-debug returns auth info", async () => {
    const res = await request(app).get("/api/v1/health/auth-debug");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("auth");
    expect(res.body).toHaveProperty("hasAuthHeader");
  });

  it("health routes are publicly accessible (no auth required)", async () => {
    // No Authorization header set — should still succeed
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
  });
});
