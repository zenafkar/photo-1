import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AIService } from "../aiProvider.js";

describe("AIService", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    process.env.REPLICATE_API_TOKEN = "test-token-r8_abc123";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("generate() provider routing", () => {
    it("uses Nano Banana Pro URL for provider 'nanobanana'", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "pred-1", status: "succeeded", output: "https://example.com/img.jpg" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await AIService.generate({ imageUrls: ["https://example.com/photo.jpg"], prompt: "test", provider: "nanobanana" });

      const calledUrl = fetchMock.mock.calls[0][0];
      expect(calledUrl).toContain("google/nano-banana-pro");
    });

    it("uses Nano Banana 2 URL for provider 'nanobanana2'", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "pred-2", status: "succeeded", output: "https://example.com/img.jpg" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await AIService.generate({ imageUrls: ["https://example.com/photo.jpg"], prompt: "test", provider: "nanobanana2" });

      const calledUrl = fetchMock.mock.calls[0][0];
      expect(calledUrl).toContain("google/nano-banana-2");
    });

    it("uses GPT-Image URL for provider 'gptimage'", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "pred-3", status: "succeeded", output: "https://example.com/img.jpg" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await AIService.generate({ imageUrls: ["https://example.com/photo.jpg"], prompt: "test", provider: "gptimage" });

      const calledUrl = fetchMock.mock.calls[0][0];
      expect(calledUrl).toContain("openai/gpt-image-2");
    });

    it("uses Nano Banana Pro as default when no provider specified", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "pred-4", status: "succeeded", output: "https://example.com/img.jpg" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await AIService.generate({ imageUrls: ["https://example.com/photo.jpg"], prompt: "test" });

      const calledUrl = fetchMock.mock.calls[0][0];
      expect(calledUrl).toContain("google/nano-banana-pro");
    });
  });

  describe("GPT-Image parameter mapping", () => {
    it("passes through GPT Image 2 native aspect ratios", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "pred-aspect", status: "succeeded", output: "https://example.com/img.jpg" }), {
          status: 200,
        })
      );

      await AIService.generate({
        imageUrls: ["https://example.com/photo.jpg"],
        prompt: "test",
        provider: "gptimage",
        aspectRatio: "9:16",
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.input.aspect_ratio).toBe("9:16");
      expect(body.input.background).toBe("opaque");
    });

    it("maps resolution to quality: 4k→high, 2k→medium, 1k→low", async () => {
      const cases = [
        { res: "4k", expected: "high" },
        { res: "2k", expected: "medium" },
        { res: "1k", expected: "low" },
      ];

      for (const { res, expected } of cases) {
        fetchMock.mockResolvedValueOnce(
          new Response(JSON.stringify({ id: `pred-${res}`, status: "succeeded", output: "https://example.com/img.jpg" }), {
            status: 200,
          })
        );

        await AIService.generate({
          imageUrls: ["https://example.com/photo.jpg"],
          prompt: "test",
          provider: "gptimage",
          resolution: res,
        });

        const body = JSON.parse(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1].body);
        expect(body.input.quality).toBe(expected);
      }
    });

    it("maps outputFormat jpg → jpeg for GPT-Image", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "pred-fmt", status: "succeeded", output: "https://example.com/img.jpg" }), {
          status: 200,
        })
      );

      await AIService.generate({
        imageUrls: ["https://example.com/photo.jpg"],
        prompt: "test",
        provider: "gptimage",
        outputFormat: "jpg",
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.input.output_format).toBe("jpeg");
    });
  });

  describe("error handling", () => {
    it("throws when REPLICATE_API_TOKEN is missing or placeholder", async () => {
      process.env.REPLICATE_API_TOKEN = "r8_...";

      await expect(
        AIService.generate({ imageUrls: ["https://example.com/photo.jpg"], prompt: "test" })
      ).rejects.toThrow("REPLICATE_API_TOKEN is missing or invalid");
    });

    it("throws AbortError as user-friendly message", async () => {
      // Returning a non-ok response triggers the error path; we test the fetch AbortError path
      fetchMock.mockRejectedValueOnce(Object.assign(new Error("The operation was aborted"), { name: "AbortError" }));

      await expect(
        AIService.generate({ imageUrls: ["https://example.com/photo.jpg"], prompt: "test" })
      ).rejects.toThrow("timed out"); // User-friendly timeout message
    });
  });
});
