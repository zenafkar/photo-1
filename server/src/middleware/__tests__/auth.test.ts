import { describe, it, expect, vi } from "vitest";
import { requireAuth } from "../auth.js";

// Mock @clerk/express
const { getAuthMock } = vi.hoisted(() => ({
  getAuthMock: vi.fn(),
}));

vi.mock("@clerk/express", () => ({
  getAuth: getAuthMock,
}));

describe("requireAuth middleware", () => {
  it("returns 401 JSON when getAuth returns null", () => {
    getAuthMock.mockReturnValue(null);

    const req: any = { headers: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized: Silakan login terlebih dahulu.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 JSON when getAuth returns object without userId", () => {
    getAuthMock.mockReturnValue({});

    const req: any = { headers: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized: Silakan login terlebih dahulu.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when getAuth returns a valid userId", () => {
    getAuthMock.mockReturnValue({ userId: "user_123", sessionId: "sess_456" });

    const req = {} as any;
    const res: any = {
      status: vi.fn(),
      json: vi.fn(),
    };
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
