import { describe, it, expect } from "vitest";
import { z } from "zod";

// Same schema as generate.ts
const generateSchema = z.object({
  imageUrls: z.array(z.string().min(1)).min(1).max(3),
  prompt: z.string().min(3),
  provider: z.enum(["replicate", "nanobanana", "nanobanana2", "gptimage"]).optional(),
  aspectRatio: z.string().optional(),
  resolution: z.string().optional(),
  outputFormat: z.string().optional(),
});

describe("generate payload validation", () => {
  it("accepts a valid payload with all fields", () => {
    const result = generateSchema.safeParse({
      imageUrls: ["https://example.com/photo.jpg"],
      prompt: "Studio lighting, 4k",
      provider: "gptimage",
      aspectRatio: "1:1",
      resolution: "2k",
      outputFormat: "jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal valid payload (only required fields)", () => {
    const result = generateSchema.safeParse({
      imageUrls: ["https://example.com/photo.jpg"],
      prompt: "Studio photo",
    });
    expect(result.success).toBe(true);
  });

  it("accepts multiple images up to 3", () => {
    const result = generateSchema.safeParse({
      imageUrls: [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
        "https://example.com/photo3.jpg",
      ],
      prompt: "Studio photo",
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 3 images", () => {
    const result = generateSchema.safeParse({
      imageUrls: [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
        "https://example.com/photo3.jpg",
        "https://example.com/photo4.jpg",
      ],
      prompt: "Studio photo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when imageUrls is empty", () => {
    const result = generateSchema.safeParse({
      imageUrls: [],
      prompt: "Test prompt here",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("imageUrls"))).toBe(true);
    }
  });

  it("rejects when prompt is shorter than 3 characters", () => {
    const result = generateSchema.safeParse({
      imageUrls: ["https://example.com/photo.jpg"],
      prompt: "ab",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
    }
  });

  it("rejects invalid provider enum value", () => {
    const result = generateSchema.safeParse({
      imageUrls: ["https://example.com/photo.jpg"],
      prompt: "Studio photo",
      provider: "invalid-provider",
    });
    expect(result.success).toBe(false);
  });

  it("allows optional fields to be omitted", () => {
    const result = generateSchema.safeParse({
      imageUrls: ["data:image/jpeg;base64,abc123"],
      prompt: "Professional studio lighting",
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
