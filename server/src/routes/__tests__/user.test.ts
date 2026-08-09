import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createTicket } from "../../services/userTicketStore.js";

// Mock Clerk
const { getAuthMock } = vi.hoisted(() => ({
  getAuthMock: vi.fn(),
}));

vi.mock("@clerk/express", () => ({
  getAuth: getAuthMock,
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  clerkClient: { users: {} },
}));

// Mock Prisma — inline mock, no import needed in hoisted
const { mockUserFindUnique, mockUserCreate, mockUserCreditCreate } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserCreate: vi.fn(),
  mockUserCreditCreate: vi.fn(),
}));

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
    },
    userCredit: {
      create: mockUserCreditCreate,
    },
    generation: {},
    $transaction: vi.fn(),
  },
}));

import { createApp } from "../../app.js";

const app = createApp();

describe("User Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/v1/user/me returns 401 without auth", async () => {
    getAuthMock.mockReturnValue({}); // no userId

    const res = await request(app).get("/api/v1/user/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/user/me creates lazy user with 3 credits on first call", async () => {
    getAuthMock.mockReturnValue({ userId: "clerk_new_user" });

    mockUserFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({
      id: "user-new",
      clerkId: "clerk_new_user",
      email: "clerk_new_user@placeholder.com",
      credits: { remainingCredits: 3, planType: "free" },
      generations: [],
    });

    const res = await request(app).get("/api/v1/user/me");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(mockUserCreate).toHaveBeenCalled();
  });

  it("GET /api/v1/user/me returns existing user profile with credits", async () => {
    getAuthMock.mockReturnValue({ userId: "clerk_existing" });

    mockUserFindUnique.mockResolvedValue({
      id: "user-1",
      clerkId: "clerk_existing",
      email: "existing@test.com",
      name: "Test User",
      credits: { remainingCredits: 5, planType: "free" },
      generations: [
        {
          id: "gen-1",
          processedUrl: "https://example.com/img1.jpg",
          preset: "Studio lighting",
          status: "completed",
          createdAt: new Date(),
        },
      ],
    });

    const res = await request(app).get("/api/v1/user/me");

    expect(res.status).toBe(200);
    expect(res.body.data.credits.remainingCredits).toBe(5);
    expect(res.body.data.generations).toHaveLength(1);
  });

  it("GET /api/v1/user/me auto-creates credits row when user has none", async () => {
    getAuthMock.mockReturnValue({ userId: "clerk_nocredits" });

    mockUserFindUnique.mockResolvedValue({
      id: "user-nc",
      clerkId: "clerk_nocredits",
      email: "nc@test.com",
      credits: null,
      generations: [],
    });

    mockUserCreditCreate.mockResolvedValue({
      remainingCredits: 3,
      planType: "free",
    });

    const res = await request(app).get("/api/v1/user/me");

    expect(res.status).toBe(200);
    expect(mockUserCreditCreate).toHaveBeenCalled();
  });

  it("POST /api/v1/user/events/ticket returns a short-lived ticket", async () => {
    getAuthMock.mockReturnValue({ userId: "clerk_events" });

    const res = await request(app).post("/api/v1/user/events/ticket");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticket).toMatch(/^[a-f0-9]{48}$/);
  });

  it("GET /api/v1/user/events/:ticket rejects an invalid ticket", async () => {
    const res = await request(app).get("/api/v1/user/events/not-a-ticket");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/user/events/:ticket reaches ticket auth without bearer auth", async () => {
    const ticket = createTicket("clerk_stream");
    mockUserFindUnique.mockResolvedValue(null);

    const res = await request(app).get(`/api/v1/user/events/${ticket}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});
