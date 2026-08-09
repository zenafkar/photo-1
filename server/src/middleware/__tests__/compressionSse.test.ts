import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock Clerk — prevents "Publishable key not valid" crash on CI
vi.mock("@clerk/express", () => ({
  getAuth: vi.fn(),
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

import { createApp } from "../../app.js";

const app = createApp();

// ── Test-only routes ──────────────────────────────────────────────
// Appended AFTER createApp() so they traverse the exact middleware chain
// registered in app.ts — including the compression() filter we want to
// pin down. These paths never match any of the app's own routes, so the
// request flows through compression before reaching these handlers.

app.get("/__test__/sse", (_req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });
  res.write("data: hello\n\n");
  res.end();
});

const bigPayload = {
  items: Array.from({ length: 200 }, (_, i) => ({
    id: i,
    name: `item-${i}`,
    description: "lorem ipsum dolor sit amet consectetur adipiscing elit".repeat(5),
  })),
};

app.get("/__test__/json", (_req, res) => {
  res.type("application/json");
  res.send(JSON.stringify(bigPayload));
});

app.get("/__test__/html", (_req, res) => {
  res.type("text/html");
  res.send(
    "<html><body>" +
    "<p>lorem ipsum dolor sit amet consectetur adipiscing elit</p>".repeat(300) +
    "</body></html>"
  );
});

describe("compression SSE filter (app.ts)", () => {
  it("does NOT compress text/event-stream responses even when gzip is accepted", async () => {
    const res = await request(app)
      .get("/__test__/sse")
      .set("Accept-Encoding", "gzip");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");
    // Core of the regression: SSE must never be gzip/brotli compressed,
    // otherwise streaming is buffered and real-time events are delayed.
    expect(res.headers["content-encoding"]).toBeUndefined();
    expect(res.text).toContain("data: hello");
  });

  it("still compresses JSON responses (default behavior preserved)", async () => {
    const res = await request(app)
      .get("/__test__/json")
      .set("Accept-Encoding", "gzip");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.headers["content-encoding"]).toBeDefined();
    expect(res.headers["content-encoding"]).toMatch(/^(gzip|br|deflate)/);
    // supertest auto-decompresses; the body must arrive intact
    expect(res.body).toEqual(bigPayload);
  });

  it("still compresses HTML responses (default behavior preserved)", async () => {
    const res = await request(app)
      .get("/__test__/html")
      .set("Accept-Encoding", "gzip");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.headers["content-encoding"]).toBeDefined();
    expect(res.headers["content-encoding"]).toMatch(/^(gzip|br|deflate)/);
    expect(res.text).toContain("lorem ipsum");
  });
});
