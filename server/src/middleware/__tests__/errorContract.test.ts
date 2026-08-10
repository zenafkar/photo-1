import { describe, it, expect } from "vitest";
import { errorBody, sendError, ErrorCodes } from "../errorContract.js";

describe("ErrorCodes", () => {
  it("contains expected error code constants", () => {
    expect(ErrorCodes.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCodes.INVALID_PAYLOAD).toBe("INVALID_PAYLOAD");
    expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe("RATE_LIMIT_EXCEEDED");
    expect(ErrorCodes.IDEMPOTENCY_KEY_REUSED).toBe("IDEMPOTENCY_KEY_REUSED");
    expect(ErrorCodes.PAYMENT_NOT_FOUND).toBe("PAYMENT_NOT_FOUND");
    expect(ErrorCodes.ORDER_NOT_FOUND).toBe("ORDER_NOT_FOUND");
    expect(ErrorCodes.USER_NOT_FOUND).toBe("USER_NOT_FOUND");
    expect(ErrorCodes.DATABASE_UNAVAILABLE).toBe("DATABASE_UNAVAILABLE");
    expect(ErrorCodes.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ErrorCodes.WEBHOOK_ACKED_DEFERRED).toBe("WEBHOOK_ACKED_DEFERRED");
  });
});

describe("errorBody", () => {
  it("returns the correct shape with required fields", () => {
    const body = errorBody("UNAUTHORIZED", "Not logged in");
    expect(body).toEqual({
      success: false,
      code: "UNAUTHORIZED",
      message: "Not logged in",
    });
  });

  it("includes details when provided", () => {
    const details = { field: "email", reason: "invalid" };
    const body = errorBody("INVALID_PAYLOAD", "Bad input", details);
    expect(body.details).toEqual(details);
  });

  it("omits details when undefined", () => {
    const body = errorBody("INTERNAL_ERROR", "Oops");
    expect(body).not.toHaveProperty("details");
  });

  it("includes request_id when req.res.locals.requestId exists", () => {
    const req = { res: { locals: { requestId: "req_abc123def456" } } };
    const body = errorBody("UNAUTHORIZED", "Nope", undefined, req);
    expect(body.request_id).toBe("req_abc123def456");
  });

  it("omits request_id when not available", () => {
    const body = errorBody("UNAUTHORIZED", "Nope");
    expect(body).not.toHaveProperty("request_id");
  });
});

describe("sendError", () => {
  it("calls res.status and res.json with the correct error body", () => {
    const statusFn = (code: number) => {
      expect(code).toBe(401);
      return { json: (body: any) => {
        expect(body).toEqual({
          success: false,
          code: "UNAUTHORIZED",
          message: "Not logged in",
          request_id: "req_111222333444",
        });
      }};
    };
    const res: any = {
      status: statusFn,
      locals: { requestId: "req_111222333444" },
    };

    sendError(res, 401, ErrorCodes.UNAUTHORIZED, "Not logged in");
  });

  it("includes details when provided", () => {
    let capturedBody: any = null;
    const res: any = {
      status: () => ({ json: (body: any) => { capturedBody = body; } }),
      locals: { requestId: "req_aabbccddeeff" },
    };

    sendError(res, 400, ErrorCodes.INVALID_PAYLOAD, "Bad input", { foo: "bar" });

    expect(capturedBody).toEqual({
      success: false,
      code: "INVALID_PAYLOAD",
      message: "Bad input",
      details: { foo: "bar" },
      request_id: "req_aabbccddeeff",
    });
  });

  it("omits request_id when res.locals has no requestId", () => {
    let capturedBody: any = null;
    const res: any = {
      status: () => ({ json: (body: any) => { capturedBody = body; } }),
      locals: {},
    };

    sendError(res, 500, ErrorCodes.INTERNAL_ERROR, "Oops");

    expect(capturedBody).toEqual({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Oops",
    });
    expect(capturedBody).not.toHaveProperty("request_id");
  });
});
