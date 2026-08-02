import { describe, it, expect } from "vitest";
import { computeCreditsToDeduct } from "../credits";

describe("computeCreditsToDeduct", () => {
  it("returns 2 for 4K resolution with any provider (except nanobanana)", () => {
    expect(computeCreditsToDeduct("4k", "gptimage")).toBe(2);
    expect(computeCreditsToDeduct("4K", "gptimage")).toBe(2);
  });

  it("returns 2 for Nano Banana Pro regardless of resolution", () => {
    expect(computeCreditsToDeduct("1k", "nanobanana")).toBe(2);
    expect(computeCreditsToDeduct("2k", "nanobanana")).toBe(2);
    expect(computeCreditsToDeduct("4k", "nanobanana")).toBe(2);
  });

  it("returns 2 for Nano Banana 2 regardless of resolution", () => {
    expect(computeCreditsToDeduct("1k", "nanobanana2")).toBe(2);
    expect(computeCreditsToDeduct("4k", "nanobanana2")).toBe(2);
  });

  it("returns 1 for 1K/2K with non-nanobanana providers", () => {
    expect(computeCreditsToDeduct("1k", "gptimage")).toBe(1);
    expect(computeCreditsToDeduct("2k", "gptimage")).toBe(1);
  });

  it("returns 1 as default when resolution is not specified", () => {
    expect(computeCreditsToDeduct("", "gptimage")).toBe(1);
    expect(computeCreditsToDeduct("", "replicate")).toBe(1);
  });
});
