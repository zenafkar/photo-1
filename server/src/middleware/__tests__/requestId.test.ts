import { describe, it, expect, vi } from "vitest";
import { requestIdMiddleware, generateRequestId } from "../requestId.js";

describe("generateRequestId", () => {
  it("returns a string matching req_<12 hex chars> format", () => {
    const id = generateRequestId();
    expect(id).toMatch(/^req_[0-9a-f]{12}$/);
  });

  it("generates unique IDs on successive calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateRequestId());
    }
    expect(ids.size).toBe(1000);
  });
});

describe("requestIdMiddleware", () => {
  it("sets X-Request-Id header on the response", () => {
    const req: any = {};
    const headers: Record<string, string> = {};
    const res: any = {
      locals: {},
      setHeader: vi.fn((key: string, value: string) => {
        headers[key] = value;
      }),
    };
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", expect.stringMatching(/^req_[0-9a-f]{12}$/));
    expect(headers["X-Request-Id"]).toMatch(/^req_[0-9a-f]{12}$/);
    expect(next).toHaveBeenCalledOnce();
  });

  it("stores requestId in res.locals", () => {
    const req: any = {};
    const res: any = {
      locals: {},
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    expect(res.locals.requestId).toBeDefined();
    expect(res.locals.requestId).toMatch(/^req_[0-9a-f]{12}$/);
    expect(next).toHaveBeenCalledOnce();
  });

  it("stores the same value in header and res.locals", () => {
    const req: any = {};
    const res: any = {
      locals: {},
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    const headerValue = (res.setHeader as any).mock.calls[0][1];
    expect(headerValue).toBe(res.locals.requestId);
  });
});
