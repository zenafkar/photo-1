// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildCustomPromptText, buildMannequinAutoPrompt, getPresetPrompt, filterPresets } from "../promptBuilder";
import type { PresetItem } from "../promptBuilder";

const mockPedestal = "a polished black marble pedestal";
const mockLighting = "soft diffused 3-point softbox studio lighting";

describe("buildCustomPromptText", () => {
  it("assembles a prompt with all components", () => {
    const result = buildCustomPromptText("Botol Serum", mockPedestal, mockLighting, [
      "subtle floating gold dust sparkle particles",
    ]);

    expect(result).toContain("Botol Serum");
    expect(result).toContain(mockPedestal);
    expect(result).toContain(mockLighting);
    expect(result).toContain("gold dust");
    expect(result).toContain("8k resolution"); // default
  });

  it("uses 'product' when name is empty", () => {
    const result = buildCustomPromptText("", mockPedestal, mockLighting, []);
    expect(result).toContain("of product,");
  });

  it("joins multiple effects", () => {
    const result = buildCustomPromptText("Test", mockPedestal, mockLighting, [
      "effect one",
      "effect two",
    ]);

    expect(result).toContain("effect one, effect two");
  });

  it("substitutes current resolution in the output", () => {
    const result = buildCustomPromptText("Item", mockPedestal, mockLighting, [], "4k");

    expect(result).toContain("4k resolution");
    expect(result).not.toContain("8k resolution");
  });
});

describe("getPresetPrompt", () => {
  it("substitutes resolution in preset prompts", () => {
    const preset = "Studio photo, 8k resolution, sharp detail";
    const result = getPresetPrompt(preset, "2k");

    expect(result).toContain("2k resolution");
    expect(result).not.toContain("8k");
  });

  it("returns unchanged when no resolution param", () => {
    const preset = "Studio photo, 8k resolution";
    const result = getPresetPrompt(preset);

    expect(result).toBe(preset);
  });
});

describe("filterPresets", () => {
  const presets: PresetItem[] = [
    { id: "1", title: "A", category: "beauty", badge: "", badgeColor: "", description: "", prompt: "p1", tags: [] },
    { id: "2", title: "B", category: "food", badge: "", badgeColor: "", description: "", prompt: "p2", tags: [] },
    { id: "3", title: "C", category: "beauty", badge: "", badgeColor: "", description: "", prompt: "p3", tags: [] },
  ];

  it("returns all presets for 'all' category", () => {
    expect(filterPresets(presets, "all")).toHaveLength(3);
  });

  it("filters to matching category", () => {
    expect(filterPresets(presets, "food")).toHaveLength(1);
    expect(filterPresets(presets, "food")[0].id).toBe("2");
  });

  it("returns empty array for non-matching category", () => {
    expect(filterPresets(presets, "tech")).toHaveLength(0);
  });
});

describe("buildMannequinAutoPrompt", () => {
  it("includes the selected surface and lighting", () => {
    const result = buildMannequinAutoPrompt({
      clothingType: "a classic t-shirt",
      material: "cotton fabric",
      color: "black",
      surface: "a rustic dark oak wood tabletop",
      lighting: "warm golden hour sunlight with soft long shadows",
      effects: ["subtle floating gold dust sparkle particles"],
    });

    expect(result).toContain("ghost mannequin photography");
    expect(result).toContain("placed on a rustic dark oak wood tabletop");
    expect(result).toContain("lit with warm golden hour sunlight with soft long shadows");
    expect(result).toContain("with subtle floating gold dust sparkle particles");
    expect(result).toContain("8k resolution");
  });

  it("uses clean studio defaults when surface and lighting are empty", () => {
    const result = buildMannequinAutoPrompt({
      clothingType: "",
      material: "",
      color: "",
      surface: "",
      lighting: "",
    });

    expect(result).toContain("A fashion item");
    expect(result).toContain("placed on a seamless pure white studio surface");
    expect(result).toContain("lit with soft diffused 3-point softbox studio lighting");
  });
});
