import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

const app = createApp();
// The telemetry route requires this shared secret
const TELEMETRY_SECRET = process.env.TELEMETRY_INGEST_SECRET || "dev-secret-change-in-production";

describe("Telemetry Routes", () => {
  it("POST /api/v1/telemetry accepts valid payload with correct secret", async () => {
    const res = await request(app)
      .post("/api/v1/telemetry")
      .set("Authorization", `Bearer ${TELEMETRY_SECRET}`)
      .send({ type: "CLIENT_UI_ERROR", errorMessage: "Test error" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/v1/telemetry returns 401 without secret", async () => {
    const res = await request(app)
      .post("/api/v1/telemetry")
      .send({});

    expect(res.status).toBe(401);
  });
});
