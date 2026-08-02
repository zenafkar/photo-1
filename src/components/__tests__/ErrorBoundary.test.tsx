import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ErrorBoundary } from "../ErrorBoundary";

// Component that throws
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test explosion!");
  }
  return React.createElement("div", null, "All good");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("renders children when no error occurs", () => {
    render(
      React.createElement(ErrorBoundary, null, React.createElement(Bomb, { shouldThrow: false }))
    );

    expect(screen.getByText("All good")).toBeDefined();
  });

  it("shows fallback UI when a child throws", () => {
    // Suppress the expected error log during this test
    render(
      React.createElement(ErrorBoundary, null, React.createElement(Bomb, { shouldThrow: true }))
    );

    expect(screen.getByText("Ups! Terjadi Kesalahan")).toBeDefined();
    expect(screen.getByText("Muat Ulang Halaman")).toBeDefined();
  });

  it("sends telemetry on error", () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    render(
      React.createElement(ErrorBoundary, null, React.createElement(Bomb, { shouldThrow: true }))
    );

    // ErrorBoundary calls fetch to POST telemetry
    expect(fetchSpy).toHaveBeenCalled();
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain("/api/v1/telemetry");

    const body = JSON.parse(options.body);
    expect(body.type).toBe("CLIENT_UI_ERROR");
  });
});
