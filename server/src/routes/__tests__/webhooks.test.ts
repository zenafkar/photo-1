import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

// Unset CLERK_WEBHOOK_SECRET so the Svix signature check is bypassed in tests
// The real .env sets this to a placeholder, which triggers the Svix header requirement
delete process.env.CLERK_WEBHOOK_SECRET;

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

import { createApp } from "../../app.js";

const app = createApp();

describe("Webhook Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/v1/webhooks/clerk handles user.created event", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/clerk")
      .send({
        type: "user.created",
        data: {
          id: "clerk_new_webhook",
          email_addresses: [{ email_address: "new@test.com" }],
          first_name: "New",
          last_name: "User",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUserUpsert).toHaveBeenCalled();
  });

  it("POST /api/v1/webhooks/clerk handles user.deleted event", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "user-del", clerkId: "clerk_del" });

    const res = await request(app)
      .post("/api/v1/webhooks/clerk")
      .send({
        type: "user.deleted",
        data: { id: "clerk_del" },
      });

    expect(res.status).toBe(200);
    expect(mockUserDelete).toHaveBeenCalled();
  });

  it("POST /api/v1/webhooks/clerk handles user.updated event", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "user-upd", clerkId: "clerk_upd", email: "old@test.com" });

    const res = await request(app)
      .post("/api/v1/webhooks/clerk")
      .send({
        type: "user.updated",
        data: {
          id: "clerk_upd",
          email_addresses: [{ email_address: "updated@test.com" }],
          first_name: "Updated",
          last_name: "Name",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/v1/webhooks/clerk returns 400 when no data payload", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/clerk")
      .send({ type: "user.created" });

    expect(res.status).toBe(400);
  });
});
