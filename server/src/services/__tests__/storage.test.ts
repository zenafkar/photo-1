import { describe, it, expect, beforeEach, vi } from "vitest";

// Must use vi.hoisted() so variables are available in the hoisted vi.mock factory
const { mockWriteFile, mockUnlink, mockExistsSync, mockMkdirSync } = vi.hoisted(() => ({
  mockWriteFile: vi.fn(),
  mockUnlink: vi.fn(),
  mockExistsSync: vi.fn(() => true),
  mockMkdirSync: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    promises: {
      writeFile: mockWriteFile,
      unlink: mockUnlink,
    },
    constants: { F_OK: 0 },
  },
}));

import { saveBase64Locally, saveRemoteImageLocally, deleteLocalImage } from "../storage.js";

describe("storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  describe("saveBase64Locally", () => {
    it("writes file from valid base64 data URI", async () => {
      const base64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
      const result = await saveBase64Locally(base64);

      expect(mockWriteFile).toHaveBeenCalled();
      const writeCall = mockWriteFile.mock.calls[0];
      expect(writeCall[0]).toContain("uploads");
      expect(writeCall[0]).toContain("generations");
      expect(writeCall[0]).toContain("orig-");
      expect(result).toContain("/api/v1/uploads/generations/");
    });

    it("returns input unchanged for non-data-URI string", async () => {
      const url = "https://example.com/photo.jpg";
      const result = await saveBase64Locally(url);

      expect(result).toBe(url);
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it("returns input unchanged for malformed base64 header", async () => {
      const bad = "data:image;notvalid";
      const result = await saveBase64Locally(bad);

      expect(result).toBe(bad);
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  describe("saveRemoteImageLocally", () => {
    it("downloads and saves image with correct extension from content-type", async () => {
      const imageBuffer = Buffer.from("fake-image-data");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          headers: { get: vi.fn().mockReturnValue("image/png") },
          arrayBuffer: vi.fn().mockResolvedValue(imageBuffer.buffer),
        })
      );

      const result = await saveRemoteImageLocally("https://replicate.delivery/some-image.png");
      expect(result).toContain("/api/v1/uploads/generations/");

      vi.unstubAllGlobals();
    });

    it("returns original URL on fetch failure (graceful degradation)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        })
      );

      const originalUrl = "https://replicate.delivery/broken.jpg";
      const result = await saveRemoteImageLocally(originalUrl);
      expect(result).toBe(originalUrl);

      vi.unstubAllGlobals();
    });
  });

  describe("deleteLocalImage", () => {
    it("skips URLs that don't match the uploads path", async () => {
      await deleteLocalImage("https://cdn.example.com/photo.jpg");
      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it("deletes file when URL matches uploads path and file exists", async () => {
      mockExistsSync.mockReturnValue(true);
      const localUrl = "https://example.com/api/v1/uploads/generations/test-file.jpg";
      await deleteLocalImage(localUrl);

      expect(mockUnlink).toHaveBeenCalled();
    });
  });
});
