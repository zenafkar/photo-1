/** Preset item shape used in the prompt generator modal */
export interface PresetItem {
  id: string;
  title: string;
  category: string;
  badge: string;
  badgeColor: string;
  description: string;
  prompt: string;
  tags: string[];
}

/** Build a custom prompt from user-selected components */
export function buildCustomPromptText(
  productName: string,
  pedestal: string,
  lighting: string,
  effects: string[],
  currentResolution?: string
): string {
  const prodName = productName.trim() || "product";
  const effectsText = effects.length > 0 ? `, with ${effects.join(", ")}` : "";
  const resText = currentResolution ? `${currentResolution.toLowerCase()} resolution` : "8k resolution";
  return `Professional commercial product photography of ${prodName}, placed on ${pedestal}, lit with ${lighting}${effectsText}, ${resText}, ultra sharp detail, high conversion e-commerce ad photo`;
}

/** Substitute resolution in preset prompts */
export function getPresetPrompt(prompt: string, currentResolution?: string): string {
  if (!currentResolution) return prompt;
  return prompt.replace(/8k resolution/gi, `${currentResolution.toLowerCase()} resolution`).replace(/8k/gi, currentResolution.toLowerCase());
}

/** Filter presets by category */
export function filterPresets(presets: PresetItem[], category: string): PresetItem[] {
  if (category === "all") return presets;
  return presets.filter((p) => p.category === category);
}
