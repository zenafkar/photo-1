import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock clerk
const { getTokenMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({
    getToken: getTokenMock,
    isLoaded: true,
    isSignedIn: true,
  }),
}));

import { useApiClient } from "../api";
import { renderHook, act } from "@testing-library/react";

describe("useApiClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    getTokenMock.mockResolvedValue("test-jwt-token");
    // Mock window.location for URL detection
    vi.stubGlobal("window", {
      location: { hostname: "localhost" },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function setup() {
    const { result } = renderHook(() => useApiClient());
    return result.current;
  }

  it("getProfile attaches Bearer token and correct headers", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const api = setup();
    await act(async () => {
      await api.getProfile();
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/user/me");
    expect(options.headers["Authorization"]).toBe("Bearer test-jwt-token");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("retries token fetch with backoff when getToken initially fails", async () => {
    vi.useFakeTimers();

    // First call rejects, second succeeds with skipCache
    getTokenMock
      .mockRejectedValueOnce(new Error("Not ready"))
      .mockResolvedValueOnce("fresh-token");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const api = setup();

    let promise: Promise<any>;
    await act(async () => {
      promise = api.getProfile();
      await vi.advanceTimersByTimeAsync(200);
    });

    // Token should have been retried at least once with skipCache
    expect(getTokenMock).toHaveBeenCalled();
    const skipCacheCalls = getTokenMock.mock.calls.filter(
      (call: any[]) => call[0]?.skipCache === true
    );
    expect(skipCacheCalls.length).toBeGreaterThanOrEqual(1);

    vi.useRealTimers();
  });

  it("throws Indonesian session error when no token after all retries", async () => {
    vi.useFakeTimers();

    getTokenMock.mockRejectedValue(new Error("Dead"));

    const api = setup();

    let error: Error | null = null;
    act(() => {
      api.getProfile().catch((e: Error) => {
        error = e;
      });
    });

    // Advance through all retry delays
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(error?.message).toContain("Sesi login belum siap");

    vi.useRealTimers();
  });

  it("handles network error with friendly Indonesian message", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const api = setup();

    await expect(api.getProfile()).rejects.toThrow("Koneksi terputus");
  });

  it("handles non-JSON response gracefully", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("<html>Not Found</html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    );

    const api = setup();

    await expect(api.getProfile()).rejects.toThrow("Respon server tidak valid");
  });

  it("generateImage calls POST /generate with correct payload", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const api = setup();
    await act(async () => {
      await api.generateImage({
        imageUrl: "data:image/jpeg;base64,abc",
        prompt: "Studio lighting",
        provider: "gptimage",
        aspectRatio: "1:1",
        resolution: "2k",
        outputFormat: "jpg",
      });
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/generate");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.imageUrl).toBe("data:image/jpeg;base64,abc");
    expect(body.prompt).toBe("Studio lighting");
    expect(body.provider).toBe("gptimage");
  });
});
