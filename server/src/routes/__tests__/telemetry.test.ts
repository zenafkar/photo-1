import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock Clerk — prevents "Publishable key not valid" crash on CI
vi.mock("@clerk/express", () => ({
  getAuth: vi.fn(),
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

import { createApp } from "../../app.js";

const app = createApp();

describe("Telemetry Routes", () => {
  it("POST /api/v1/telemetry accepts valid payload with known type", async () => {
    const res = await request(app)
      .post("/api/v1/telemetry")
      .send({ type: "CLIENT_UI_ERROR", errorMessage: "Test error" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/v1/telemetry accepts API_5XX type", async () => {
    const res = await request(app)
      .post("/api/v1/telemetry")
      .send({ type: "API_5XX", errorName: "TestError", url: "/api/v1/test" });

    expect(res.status).toBe(200);
  });

  it("POST /api/v1/telemetry rejects unknown type", async () => {
    const res = await request(app)
      .post("/api/v1/telemetry")
      .send({ type: "MALICIOUS_INJECTION", errorName: "bad" });

    expect(res.status).toBe(400);
  });

  it("POST /api/v1/telemetry rejects extra unknown fields", async () => {
    const res = await request(app)
      .post("/api/v1/telemetry")
      .send({ type: "CLIENT_UI_ERROR", injectedField: "should be rejected" });

    expect(res.status).toBe(400);
  });

  it("POST /api/v1/telemetry rejects oversized errorName", async () => {
    const res = await request(app)
      .post("/api/v1/telemetry")
      .send({ type: "CLIENT_UI_ERROR", errorName: "x".repeat(201) });

    expect(res.status).toBe(400);
  });

  it("POST /api/v1/telemetry rejects empty body", async () => {
    const res = await request(app)
      .post("/api/v1/telemetry")
      .send({});

    expect(res.status).toBe(400);
  });
});
