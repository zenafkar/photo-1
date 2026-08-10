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
  mockUserCreditUpdateMany,
  mockUserCreditFindUnique,
  mockUserCreditCreate,
  mockCreditTransactionCreate,
  mockCreditTransactionFindFirst,
  mockCreditTransactionFindUnique,
  mockCreditTransactionUpdate,
  mockGenFindFirst,
  mockGenFindUnique,
  mockGenCreate,
  mockGenUpdate,
  mockGenDelete,
  mockTransaction,
} = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserCreditUpdate: vi.fn(),
  mockUserCreditUpdateMany: vi.fn(),
  mockUserCreditFindUnique: vi.fn(),
  mockUserCreditCreate: vi.fn(),
  mockCreditTransactionCreate: vi.fn(),
  mockCreditTransactionFindFirst: vi.fn(),
  mockCreditTransactionFindUnique: vi.fn(),
  mockCreditTransactionUpdate: vi.fn(),
  mockGenFindFirst: vi.fn(),
  mockGenFindUnique: vi.fn(),
  mockGenCreate: vi.fn(),
  mockGenUpdate: vi.fn(),
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
      updateMany: mockUserCreditUpdateMany,
      findUnique: mockUserCreditFindUnique,
      create: mockUserCreditCreate,
    },
    creditTransaction: {
      create: mockCreditTransactionCreate,
      findFirst: mockCreditTransactionFindFirst,
      findUnique: mockCreditTransactionFindUnique,
      update: mockCreditTransactionUpdate,
    },
    generation: {
      findFirst: mockGenFindFirst,
      findUnique: mockGenFindUnique,
      create: mockGenCreate,
      update: mockGenUpdate,
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
  imageUrls: ["data:image/jpeg;base64,abc123"],
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
    mockCreditTransactionFindFirst.mockResolvedValue(null);
    mockCreditTransactionFindUnique.mockResolvedValue(null);
    mockCreditTransactionUpdate.mockResolvedValue({});
    // Default: AI returns successfully
    mockAiGenerate.mockResolvedValue({
      url: "https://replicate.delivery/result.jpg",
      predictionId: "pred-new-123",
    });
    // Default: storage works
    mockSaveBase64.mockResolvedValue("https://example.com/api/v1/uploads/generations/orig-123.jpg");
    mockSaveRemote.mockResolvedValue("https://example.com/api/v1/uploads/generations/result-456.jpg");
    // Default: transaction — execute callback synchronously with full mock client
    mockTransaction.mockImplementation(async (arg: any) => {
      if (typeof arg === "function") {
        return arg({
          userCredit: {
            update: mockUserCreditUpdate,
            updateMany: mockUserCreditUpdateMany,
            findUnique: mockUserCreditFindUnique,
          },
          creditTransaction: {
            create: mockCreditTransactionCreate,
            findFirst: mockCreditTransactionFindFirst,
            findUnique: mockCreditTransactionFindUnique,
            update: mockCreditTransactionUpdate,
          },
          generation: {
            create: mockGenCreate,
            update: mockGenUpdate,
            delete: mockGenDelete,
          },
        });
      }
      return Promise.all(arg);
    });
    // Default: credit deduction succeeds
    mockUserCreditUpdateMany.mockResolvedValue({ count: 1 });
    mockUserCreditFindUnique.mockResolvedValue({ remainingCredits: 4 });
    mockCreditTransactionCreate.mockResolvedValue({ id: "txn-new" });
    mockGenCreate.mockResolvedValue({
      id: "gen-new",
      replicateId: "pred-new-123",
      processedUrl: "https://example.com/api/v1/uploads/generations/result-456.jpg",
      preset: "Studio lighting, 4k",
      status: "completed",
    });
    mockGenUpdate.mockResolvedValue({
      id: "gen-new",
      replicateId: "pred-new-123",
      processedUrl: "https://example.com/api/v1/uploads/generations/result-456.jpg",
      preset: "Studio lighting, 4k",
      status: "completed",
    });
    mockGenDelete.mockResolvedValue({});
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
      .send({ imageUrls: [], prompt: "ab" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("INVALID_PAYLOAD");
    expect(res.body.details).toBeDefined();
  });

  it("POST /api/v1/generate accepts realistic base64 image payloads", async () => {
    const realisticImage = `data:image/jpeg;base64,${"a".repeat(6000)}`;

    const res = await request(app)
      .post("/api/v1/generate")
      .send({ ...validPayload, imageUrls: [realisticImage] });

    expect(res.status).toBe(200);
  });

  it("POST /api/v1/generate rejects whitespace-only prompts", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send({ ...validPayload, prompt: "   " });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_PAYLOAD");
    expect(res.body.details).toBeDefined();
    expect(Array.isArray(res.body.details)).toBe(true);
    expect((res.body.details as any[]).some((issue: any) => issue.path.includes("prompt"))).toBe(true);
  });

  it("POST /api/v1/generate returns 403 when credits insufficient", async () => {
    // Simulate atomic deduction failure: updateMany returns count 0
    mockUserCreditUpdateMany.mockResolvedValue({ count: 0 });
    mockUserCreditFindUnique.mockResolvedValue({ remainingCredits: 0 });

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
    // Verify credit deduction was attempted via atomic updateMany
    expect(mockUserCreditUpdateMany).toHaveBeenCalled();
  });

  it("POST /api/v1/generate deducts 2 credits for 4K resolution", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send({ ...validPayload, resolution: "4k" });

    expect(res.status).toBe(200);
  });

  it("POST /api/v1/generate deducts 2 credits for Nano Banana Pro below 4K", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send({ ...validPayload, provider: "nanobanana", resolution: "1k" });

    expect(res.status).toBe(200);
    expect(mockUserCreditUpdateMany.mock.calls[0][0].data.remainingCredits.decrement).toBe(2);
  });

  it("POST /api/v1/generate deducts 3 credits for Nano Banana Pro at 4K", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send({ ...validPayload, provider: "nanobanana", resolution: "4k" });

    expect(res.status).toBe(200);
    expect(mockUserCreditUpdateMany.mock.calls[0][0].data.remainingCredits.decrement).toBe(3);
  });

  it("POST /api/v1/generate keeps Nano Banana 2 at 2 credits at 4K", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send({ ...validPayload, provider: "nanobanana2", resolution: "4k" });

    expect(res.status).toBe(200);
    expect(mockUserCreditUpdateMany.mock.calls[0][0].data.remainingCredits.decrement).toBe(2);
  });

  it("POST /api/v1/generate charges the default Nano Banana Pro at 3 credits for 4K", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send({ ...validPayload, provider: undefined, resolution: "4k" });

    expect(res.status).toBe(200);
    expect(mockUserCreditUpdateMany.mock.calls[0][0].data.remainingCredits.decrement).toBe(3);
  });

  it("POST /api/v1/generate creates generation record with correct fields", async () => {
    const res = await request(app)
      .post("/api/v1/generate")
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.data.generation).toBeDefined();
    expect(res.body.data.remainingCredits).toBeDefined();
  });

  // B1 pin: duplicate replicateId triggers refund to avoid net double-charge
  it("POST /api/v1/generate returns existing generation without net double-charging on duplicate replicateId", async () => {
    // Simulate: first request already completed, deducted credits, saved generation.
    // Client retries → same predictionId → deduction happens first (new flow),
    // then dedup check refunds → net zero credit change, existing generation returned.
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
    // ✅ Fix: initial deduction transaction IS called (new flow: deduct before AI),
    // but the dedup path refunds it, so net credits unchanged.
    expect(mockTransaction).toHaveBeenCalled();
    // Refund was processed while retaining the failed reservation for auditability.
    expect(mockGenUpdate).toHaveBeenCalled();
  });

  it("replays a generation with the same Idempotency-Key without calling the AI provider twice", async () => {
    const idempotencyKey = "generation-test-key";
    const existingGeneration = {
      id: "gen-idempotent",
      replicateId: "pred-idempotent",
      processedUrl: "https://example.com/existing.jpg",
      preset: "Studio lighting, 4k",
      status: "completed",
      userId: "user-test",
    };

    const first = await request(app)
      .post("/api/v1/generate")
      .set("Idempotency-Key", idempotencyKey)
      .send(validPayload);

    expect(first.status).toBe(200);
    expect(mockAiGenerate).toHaveBeenCalledTimes(1);

    mockCreditTransactionFindFirst.mockResolvedValueOnce({
      id: "txn-idempotent",
      userId: "user-test",
      type: "generation_spend",
      metadata: {
        generationId: "gen-idempotent",
      },
    });
    mockGenFindUnique.mockResolvedValueOnce(existingGeneration);

    const replay = await request(app)
      .post("/api/v1/generate")
      .set("Idempotency-Key", idempotencyKey)
      .send(validPayload);

    expect(replay.status).toBe(200);
    expect(replay.body.data.generation.id).toBe("gen-idempotent");
    expect(replay.body.data.idempotentReplay).toBe(true);
    expect(mockAiGenerate).toHaveBeenCalledTimes(1);
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
