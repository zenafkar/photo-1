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

export interface MannequinOptions {
  clothingType: string;
  material: string;
  color: string;
  vibe: string;
}

export const MANNEQUIN_CLOTHING_TYPES = [
  { label: 'Kemeja (Shirt)', val: 'a button-up shirt' },
  { label: 'Kaos (T-shirt)', val: 'a classic t-shirt' },
  { label: 'Gaun (Dress)', val: 'an elegant dress' },
  { label: 'Celana (Pants/Trousers)', val: 'a pair of trousers' },
  { label: 'Jaket / Mantel (Jacket/Coat)', val: 'a stylish jacket' },
  { label: 'Rok (Skirt)', val: 'a fashion skirt' },
  { label: 'Pakaian Olahraga (Activewear)', val: 'sportswear activewear' },
];

export const MANNEQUIN_MATERIALS = [
  { label: 'Katun (Cotton)', val: 'cotton fabric' },
  { label: 'Satin / Sutra (Satin/Silk)', val: 'smooth satin silk fabric' },
  { label: 'Denim / Jeans', val: 'denim texture' },
  { label: 'Linen', val: 'breathable linen texture' },
  { label: 'Rajut (Knit/Wool)', val: 'cozy knit wool' },
  { label: 'Kulit (Leather)', val: 'premium leather' },
];

export const MANNEQUIN_VIBES = [
  { label: 'Minimalist White Studio', val: 'seamless pure white studio background, soft diffused 3-point lighting, clean minimalist aesthetic' },
  { label: 'Moody Dark / Luxury', val: 'dark moody studio background, dramatic spotlighting, high fashion luxury editorial look' },
  { label: 'Warm E-commerce / Cozy', val: 'warm ambient lighting, soft beige aesthetic background, inviting cozy e-commerce catalog style' },
  { label: 'Streetwear / Urban', val: 'industrial urban background, high contrast strobe lighting, edgy streetwear aesthetic' },
  { label: 'Pastel / Soft Beauty', val: 'soft pastel color background, gentle dreamy lighting, elegant soft aesthetic' },
];

export function buildMannequinAutoPrompt(options: MannequinOptions, currentResolution?: string): string {
  const type = options.clothingType.trim() || 'A fashion item';
  const material = options.material.trim() ? `made of ${options.material.trim()}` : '';
  const color = options.color.trim() ? `in ${options.color.trim()} color` : '';
  const vibe = options.vibe.trim() || MANNEQUIN_VIBES[0].val;
  
  const resText = currentResolution ? `${currentResolution.toLowerCase()} resolution` : "8k resolution";

  const parts = [
    type,
    material,
    color,
    `ghost mannequin photography, invisible mannequin effect, flat front view`,
    vibe,
    `macro texture photography, highly detailed, professional commercial fashion photography, ${resText}`
  ];

  return parts.filter(p => p).join(', ');
}
