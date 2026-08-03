import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { Webhook } from "svix";

// Set a test webhook secret — the handler now FAILS CLOSED when unset.
// Svix requires the secret to be valid base64. This is a base64-encoded test key.
const TEST_WEBHOOK_SECRET = "whsec_" + Buffer.from("test-secret-32-bytes-for-svix!!!").toString("base64");
process.env.CLERK_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

/** Generate valid Svix headers for a test payload */
function svixHeaders(payload: object): Record<string, string> {
  const wh = new Webhook(TEST_WEBHOOK_SECRET);
  const timestamp = new Date();
  const payloadStr = JSON.stringify(payload);
  const msgId = `test-msg-${timestamp.getTime()}`;
  // Svix sign(msgId: string, timestamp: Date, payload: string)
  const signature = wh.sign(msgId, timestamp, payloadStr);
  return {
    "svix-id": msgId,
    "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "svix-signature": signature,
  };
}

// Mock Prisma
const { mockUserFindUnique, mockUserUpsert, mockUserDelete, mockUserUpdate } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserUpsert: vi.fn(),
  mockUserDelete: vi.fn(),
  mockUserUpdate: vi.fn(),
}));

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      upsert: mockUserUpsert,
      delete: mockUserDelete,
      update: mockUserUpdate,
    },
  },
}));

// Mock Clerk — prevents "Publishable key not valid" crash on CI
vi.mock("@clerk/express", () => ({
  getAuth: vi.fn(),
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

import { createApp } from "../../app.js";

const app = createApp();

describe("Webhook Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/v1/webhooks/clerk handles user.created event", async () => {
    const payload = {
      type: "user.created",
      data: {
        id: "clerk_new_webhook",
        email_addresses: [{ email_address: "new@test.com" }],
        first_name: "New",
        last_name: "User",
      },
    };
    const headers = svixHeaders(payload);

    const res = await request(app)
      .post("/api/v1/webhooks/clerk")
      .set("svix-id", headers["svix-id"])
      .set("svix-timestamp", headers["svix-timestamp"])
      .set("svix-signature", headers["svix-signature"])
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUserUpsert).toHaveBeenCalled();
  });

  it("POST /api/v1/webhooks/clerk handles user.deleted event", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "user-del", clerkId: "clerk_del" });

    const payload = {
      type: "user.deleted",
      data: { id: "clerk_del" },
    };
    const headers = svixHeaders(payload);

    const res = await request(app)
      .post("/api/v1/webhooks/clerk")
      .set("svix-id", headers["svix-id"])
      .set("svix-timestamp", headers["svix-timestamp"])
      .set("svix-signature", headers["svix-signature"])
      .send(payload);

    expect(res.status).toBe(200);
    expect(mockUserDelete).toHaveBeenCalled();
  });

  it("POST /api/v1/webhooks/clerk handles user.updated event", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "user-upd", clerkId: "clerk_upd", email: "old@test.com" });

    const payload = {
      type: "user.updated",
      data: {
        id: "clerk_upd",
        email_addresses: [{ email_address: "updated@test.com" }],
        first_name: "Updated",
        last_name: "Name",
      },
    };
    const headers = svixHeaders(payload);

    const res = await request(app)
      .post("/api/v1/webhooks/clerk")
      .set("svix-id", headers["svix-id"])
      .set("svix-timestamp", headers["svix-timestamp"])
      .set("svix-signature", headers["svix-signature"])
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/v1/webhooks/clerk returns 400 when no data payload", async () => {
    const payload = { type: "user.created" };
    const headers = svixHeaders(payload);

    const res = await request(app)
      .post("/api/v1/webhooks/clerk")
      .set("svix-id", headers["svix-id"])
      .set("svix-timestamp", headers["svix-timestamp"])
      .set("svix-signature", headers["svix-signature"])
      .send(payload);

    expect(res.status).toBe(400);
  });

  it("POST /api/v1/webhooks/clerk returns 401 with invalid signature", async () => {
    const payload = {
      type: "user.created",
      data: { id: "clerk_test", email_addresses: [{ email_address: "test@test.com" }] },
    };

    const res = await request(app)
      .post("/api/v1/webhooks/clerk")
      .set("svix-id", "fake-id")
      .set("svix-timestamp", "1234567890")
      .set("svix-signature", "v1,fake-signature")
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
