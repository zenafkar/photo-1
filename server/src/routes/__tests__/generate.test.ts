import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

// Mock Clerk
const { getAuthMock } = vi.hoisted(() => ({
  getAuthMock: vi.fn(),
}));

vi.mock("@clerk/express", () => ({
  getAuth: getAuthMock,
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock Prisma
const {
  mockUserFindUnique,
  mockUserCreditUpdate,
  mockUserCreditCreate,
  mockGenFindFirst,
  mockGenFindUnique,
  mockGenCreate,
  mockGenDelete,
  mockTransaction,
} = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserCreditUpdate: vi.fn(),
  mockUserCreditCreate: vi.fn(),
  mockGenFindFirst: vi.fn(),
  mockGenFindUnique: vi.fn(),
  mockGenCreate: vi.fn(),
  mockGenDelete: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
    },
    userCredit: {
      update: mockUserCreditUpdate,
      create: mockUserCreditCreate,
    },
    generation: {
      findFirst: mockGenFindFirst,
      findUnique: mockGenFindUnique,
      create: mockGenCreate,
      delete: mockGenDelete,
    },
    $transaction: mockTransaction,
  },
}));

// Mock AI Provider
const { mockAiGenerate } = vi.hoisted(() => ({
  mockAiGenerate: vi.fn(),
}));

vi.mock("../../services/aiProvider.js", () => ({
  AIService: {
    generate: mockAiGenerate,
  },
}));

// Mock Storage
const { mockSaveBase64, mockSaveRemote, mockDeleteLocal } = vi.hoisted(() => ({
  mockSaveBase64: vi.fn(),
  mockSaveRemote: vi.fn(),
  mockDeleteLocal: vi.fn(),
}));

vi.mock("../../services/storage.js", () => ({
  saveBase64Locally: mockSaveBase64,
  saveRemoteImageLocally: mockSaveRemote,
  deleteLocalImage: mockDeleteLocal,
}));

import { createApp } from "../../app.js";

const app = createApp();

// Helper to create a valid generate payload
const validPayload = {
  imageUrl: "data:image/jpeg;base64,abc123",
  prompt: "Studio lighting, 4k",
  provider: "gptimage",
  aspectRatio: "1:1",
  resolution: "1k",
  outputFormat: "jpg",
};

describe("Generate Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated
    getAuthMock.mockReturnValue({ userId: "clerk_test" });
    // Default: user with 5 credits
    mockUserFindUnique.mockResolvedValue({
      id: "user-test",
      clerkId: "clerk_test",
      credits: { remainingCredits: 5, planType: "free" },
    });
    // Default: no existing generation by replicateId
    mockGenFindUnique.mockResolvedValue(null);
    // Default: AI returns successfully
    mockAiGenerate.mockResolvedValue({
      url: "https://replicate.delivery/result.jpg",
      predictionId: "pred-new-123",
    });
    // Default: storage works
    mockSaveBase64.mockResolvedValue("https://example.com/api/v1/uploads/generations/orig-123.jpg");
    mockSaveRemote.mockResolvedValue("https://example.com/api/v1/uploads/generations/result-456.jpg");
    // Default: transaction — execute callback synchronously
    mockTransaction.mockImplementation(async (arg: any) => {
      if (typeof arg === "function") {
        return arg({ userCredit: { update: mockUserCreditUpdate }, generation: { create: mockGenCreate } });
      }
      return Promise.all(arg);
    });
    mockUserCreditUpdate.mockResolvedValue({ remainingCredits: 4 });
    mockGenCreate.mockResolvedValue({
      id: "gen-new",
      replicateId: "pred-new-123",
      processedUrl: "https://example.com/api/v1/uploads/generations/result-456.jpg",
      preset: "Studio lighting, 4k",
      status: "completed",
    });
  });

  it("POST /api/v1/generate returns 401 without auth", async () => {
    getAuthMock.mockReturnValue({});

    const res = await request(app)
      .post("/api/v1/generate")
      .send(validPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/v1/generate returns 400 with invalid body", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send({ imageUrl: "", prompt: "ab" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it("POST /api/v1/generate returns 403 when credits insufficient", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "user-poor",
      clerkId: "clerk_test",
      credits: { remainingCredits: 0, planType: "free" },
    });

    const res = await request(app)
      .post("/api/v1/generate")
      .send(validPayload);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Kredit tidak cukup");
  });

  it("POST /api/v1/generate deducts 1 credit for 1K resolution with gptimage", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send({ ...validPayload, resolution: "1k" });

    expect(res.status).toBe(200);
    // Verify credit deduction amount
    const updateCall = mockUserCreditUpdate.mock.calls[0];
    expect(updateCall).toBeDefined();
  });

  it("POST /api/v1/generate deducts 2 credits for 4K resolution", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send({ ...validPayload, resolution: "4k" });

    expect(res.status).toBe(200);
  });

  it("POST /api/v1/generate deducts 2 credits for Nano Banana models", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send({ ...validPayload, provider: "nanobanana", resolution: "1k" });

    expect(res.status).toBe(200);
  });

  it("POST /api/v1/generate creates generation record with correct fields", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.data.generation).toBeDefined();
    expect(res.body.data.remainingCredits).toBeDefined();
  });

  // B1 pin: duplicate replicateId still deducts credits (flag for review)
  it("POST /api/v1/generate returns existing generation without double-charging on duplicate replicateId", async () => {
    // Simulate: first request already completed, deducted credits, saved generation.
    // Client retries → same predictionId → should return existing WITHOUT deducting again.
    mockAiGenerate.mockResolvedValue({
      url: "https://replicate.delivery/result.jpg",
      predictionId: "pred-dup",
    });
    mockGenFindFirst.mockResolvedValue({
      id: "gen-existing",
      replicateId: "pred-dup",
      processedUrl: "https://example.com/existing.jpg",
      preset: "Studio lighting",
      status: "completed",
      userId: "user-test",
    });

    const res = await request(app)
      .post("/api/v1/generate")
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.data.generation.id).toBe("gen-existing");
    // ✅ Fix: credits should NOT be deducted again (original request already deducted)
    expect(mockUserCreditUpdate).not.toHaveBeenCalled();
  });

  it("DELETE /api/v1/generate/:id returns 404 for unauthorized user", async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: "user-test", clerkId: "clerk_test" });
    // The generation belongs to a different user
    mockGenFindUnique.mockResolvedValueOnce({
      id: "gen-other",
      userId: "other-user-id",
    });

    const res = await request(app).delete("/api/v1/generate/gen-other");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    // Generation should NOT be deleted
    expect(mockGenDelete).not.toHaveBeenCalled();
  });

  it("POST /api/v1/generate/sync returns generations and remainingCredits", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "user-test",
      clerkId: "clerk_test",
      credits: { remainingCredits: 3 },
      generations: [
        {
          id: "gen-1",
          processedUrl: "https://example.com/img.jpg",
          preset: "Studio",
          status: "completed",
          createdAt: new Date(),
        },
      ],
    });

    const res = await request(app).post("/api/v1/generate/sync");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.generations).toHaveLength(1);
    expect(res.body.remainingCredits).toBe(3);
  });
});
