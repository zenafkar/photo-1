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
  pattern?: string;
  mannequinType?: string;
  pose?: string;
  cameraAngle?: string;
  framing?: string;
  surface: string;
  lighting: string;
  shadow?: string;
  additionalDetails?: string;
  effects?: string[];
}

export const MANNEQUIN_CLOTHING_TYPES = [
  { label: 'Abaya', val: 'an elegant abaya' },
  { label: 'Mukena', val: 'a beautiful mukena prayer dress' },
  { label: 'Kemeja (Shirt)', val: 'a button-up shirt' },
  { label: 'Kaos (T-shirt)', val: 'a classic t-shirt' },
  { label: 'Gaun (Dress)', val: 'an elegant dress' },
  { label: 'Celana (Pants/Trousers)', val: 'a pair of trousers' },
  { label: 'Jaket / Mantel (Jacket/Coat)', val: 'a stylish jacket' },
  { label: 'Rok (Skirt)', val: 'a fashion skirt' },
  { label: 'Pakaian Olahraga (Activewear)', val: 'sportswear activewear' },
  { label: 'Lainnya (Tulis sendiri)', val: 'custom' },
];

export const MANNEQUIN_MATERIALS = [
  { label: 'Katun (Cotton)', val: 'cotton fabric' },
  { label: 'Satin / Sutra (Satin/Silk)', val: 'smooth satin silk fabric' },
  { label: 'Denim / Jeans', val: 'denim texture' },
  { label: 'Linen', val: 'breathable linen texture' },
  { label: 'Rajut (Knit/Wool)', val: 'cozy knit wool' },
  { label: 'Kulit (Leather)', val: 'premium leather' },
  { label: 'Lainnya (Tulis sendiri)', val: 'custom' },
];

export function buildMannequinAutoPrompt(options: MannequinOptions, currentResolution?: string): string {
  const type = options.clothingType.trim() || 'A fashion item';
  const material = options.material.trim() ? `made of ${options.material.trim()}` : '';
  const color = options.color.trim() ? `in ${options.color.trim()} color` : '';
  const pattern = options.pattern?.trim() ? `with ${options.pattern.trim()}` : '';
  const mannequin = options.mannequinType?.trim() || 'an invisible mannequin';
  const pose = options.pose?.trim() || 'a flat front presentation';
  const cameraAngle = options.cameraAngle?.trim() || 'a straight-on camera angle';
  const framing = options.framing?.trim() || 'full garment framing';
  const surface = options.surface.trim() || 'a seamless pure white studio surface';
  const lighting = options.lighting.trim() || 'soft diffused 3-point softbox studio lighting';
  const shadow = options.shadow?.trim() || 'a subtle natural contact shadow';
  const additionalDetails = options.additionalDetails?.trim();
  const effects = options.effects?.filter(Boolean) ?? [];
  
  const resText = currentResolution ? `${currentResolution.toLowerCase()} resolution` : "8k resolution";

  const parts = [
    type,
    material,
    color,
    pattern,
    `ghost mannequin photography, displayed on ${mannequin}, ${pose}`,
    `${cameraAngle}, ${framing}`,
    `placed on ${surface}`,
    `lit with ${lighting}`,
    shadow,
    effects.length > 0 ? `with ${effects.join(', ')}` : '',
    additionalDetails ? `preserve these details exactly: ${additionalDetails}` : '',
    `preserve the exact garment design, proportions, silhouette, stitching, logo placement, color, pattern, and fabric texture`,
    `highly detailed professional commercial fashion photography, ${resText}`
  ];

  return parts.filter(p => p).join(', ');
}
