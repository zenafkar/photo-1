import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Wand2, X, Copy, Check, RefreshCw,
  ShoppingBag, Layers, Sun, Camera, CheckCircle2,
  ArrowRight, Lightbulb, ChevronDown, ChevronUp,
  Zap, Palette, ZapOff, Box, Table2, Square, PanelTop, Frame,
  Coffee, Building, Diamond
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  buildCustomPromptText,
  getPresetPrompt,
  buildMannequinAutoPrompt,
  MANNEQUIN_CLOTHING_TYPES,
  MANNEQUIN_MATERIALS,
  type PresetItem,
} from '../lib/promptBuilder';

// ── Props ──────────────────────────────────────────────
interface PromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (prompt: string) => void;
  onGeneratePrompt?: (prompt: string) => void;
  currentResolution?: string;
}

// ── Data ───────────────────────────────────────────────
const PRESETS: PresetItem[] = [
  {
    id: 'beauty-1',
    title: 'Organic Skincare & Beauty',
    category: 'beauty',
    badge: 'High Conversion',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    description:
      'Tampilan alami & segar cocok untuk produk kosmetik dengan sentuhan daun botanical.',
    prompt:
      'Professional commercial product photograph of a product placed on a smooth beige stone pedestal, surrounded by soft green eucalyptus leaves and translucent water droplets, soft morning sunbeams filtering through, clean pastel background, 8k resolution, photorealistic, Vogue editorial aesthetic',
    tags: ['Soft Light', 'Botanical', 'Water Droplets'],
  },
  {
    id: 'luxury-1',
    title: 'Luxury Dark Marble Studio',
    category: 'luxury',
    badge: 'Best Seller',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    description:
      'Tampilan premium & mewah dengan marmer hitam, efek emas glowing, dan pencahayaan sinematik.',
    prompt:
      'High-end luxury studio photograph of a product resting on a polished dark black marble pedestal, fine gold dust particles floating gracefully, dramatic cinematic rim light, crisp reflections, moody elegant dark backdrop, ultra-detailed 8k resolution',
    tags: ['Dark Marble', 'Gold Particles', 'Moody'],
  },
  {
    id: 'marketplace-1',
    title: 'Tokopedia & Shopee Clean Studio',
    category: 'marketplace',
    badge: 'Clean & Sharp',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    description:
      'Latar polos studio dengan softbox lighting untuk etalase jualan yang bersih & profesional.',
    prompt:
      'Professional studio product photo on a seamless clean white background, soft diffused 3-point softbox studio lighting, subtle soft contact shadow beneath the product, sharp focus on product details, high conversion marketplace advertisement look',
    tags: ['Pure White BG', 'Softbox Light', 'Zero Distraction'],
  },
  {
    id: 'food-1',
    title: 'Warm Rustic Food & Cafe Vibe',
    category: 'food',
    badge: 'Appetizing',
    badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    description:
      'Pencahayaan hangat dengan latar meja kayu rustic & efek bokeh kafe.',
    prompt:
      'Commercial food photography of a product on a rustic dark oak wooden tabletop, warm ambient sunlight, shallow depth of field with beautiful cozy cafe background bokeh, scattered fresh ingredients, golden hour glow, highly detailed 8k',
    tags: ['Wood Table', 'Cozy Bokeh', 'Warm Sunlight'],
  },
  {
    id: 'fashion-1',
    title: 'Streetwear & Urban Footwear',
    category: 'fashion',
    badge: 'Trending',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    description:
      'Tampilan dinamis & modern untuk sepatu sneakers, tas, dan pakaian gaya anak muda.',
    prompt:
      'Dynamic commercial photography of product placed on an industrial concrete podium, dramatic high-contrast studio strobe lighting, subtle motion smoke particles, sharp crisp textures, urban streetwear magazine photoshoot',
    tags: ['Concrete', 'High Contrast', 'Urban'],
  },
  {
    id: 'tech-1',
    title: 'Futuristic Cyber Tech',
    category: 'tech',
    badge: 'High Tech',
    badgeColor: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
    description:
      'Pencahayaan neon cyan & magenta pada permukaan matte gelap untuk gadget.',
    prompt:
      'Sleek tech product photography of product resting on a dark matte acrylic surface, futuristic neon cyan and purple ambient glow, subtle sharp reflection, modern minimalist tech aesthetic, 8k resolution, ultra-clean studio framing',
    tags: ['Neon Glow', 'Cyberpunk', 'Modern'],
  },
];

const QUICK_SUGGESTIONS = [
  'Botol Serum Skincare',
  'Sepatu Sneakers',
  'Jam Tangan Pria',
  'Kopi Bubuk',
  'Tas Kulit Wanita',
  'Botol Parfum',
  'Hijab & Fashion',
  'Earphone TWS',
];

const PEDESTAL_OPTIONS = [
  { label: 'Podium Marmer Hitam', val: 'a polished black marble pedestal with subtle white veining', icon: <Box className="w-4 h-4" strokeWidth={1.8} /> },
  { label: 'Meja Kayu Oak Rustic', val: 'a rustic dark oak wood tabletop', icon: <Table2 className="w-4 h-4" strokeWidth={1.8} /> },
  { label: 'Batu Beige Organik', val: 'a smooth beige natural stone pedestal', icon: <Square className="w-4 h-4" strokeWidth={1.8} /> },
  { label: 'Studio Putih Polos', val: 'a seamless pure white studio surface', icon: <PanelTop className="w-4 h-4" strokeWidth={1.8} /> },
  { label: 'Akrilik Kaca Gelap', val: 'a sleek dark matte acrylic reflective surface', icon: <Frame className="w-4 h-4" strokeWidth={1.8} /> },
  { label: 'Kain Sutra Lembut', val: 'draped soft champagne silk fabric waves', icon: <Layers className="w-4 h-4" strokeWidth={1.8} /> },
];

const LIGHTING_OPTIONS = [
  { label: 'Studio Softbox Diffused', val: 'soft diffused 3-point softbox studio lighting', icon: '💡' },
  { label: 'Cinematic Spotlight & Gold Glow', val: 'dramatic cinematic spotlight with golden rim light', icon: '🎬' },
  { label: 'Sinar Matahari Pagi (Sunbeam)', val: 'natural warm sunbeams filtering through window blinds', icon: '🌤️' },
  { label: 'Neon Cyberpunk (Cyan/Purple)', val: 'futuristic dual neon cyan and violet ambient lighting', icon: '🌃' },
  { label: 'Golden Hour Sunset Vibe', val: 'warm golden hour sunlight with soft long shadows', icon: '🌅' },
];

const EXTRA_EFFECTS = [
  { label: 'Debu Emas Glowing', val: 'subtle floating gold dust sparkle particles', icon: '✨' },
  { label: 'Embun & Cipratan Air', val: 'fresh water droplets and subtle water splash ripples', icon: '💧' },
  { label: 'Daun Botanical & Bayangan', val: 'soft green eucalyptus leaves with gentle leaf shadow overlay', icon: '🌿' },
  { label: 'Bokeh Latar Belakang Kafe', val: 'cozy ambient background bokeh blur', icon: '🫧' },
  { label: 'Asap Tipis Sinematik', val: 'subtle ethereal smoke mist in the background', icon: '🌫️' },
];

const MANNEQUIN_TYPES = [
  { label: 'Invisible mannequin', val: 'an invisible mannequin' },
  { label: 'White studio mannequin', val: 'a clean white studio mannequin' },
  { label: 'Hanging garment presentation', val: 'a minimal invisible hanging garment form' },
];

const MANNEQUIN_POSES = [
  { label: 'Flat front', val: 'a flat front presentation' },
  { label: 'Standing straight', val: 'a standing straight presentation' },
  { label: 'Natural three-quarter', val: 'a natural three-quarter presentation' },
];

const MANNEQUIN_CAMERA_ANGLES = [
  { label: 'Front', val: 'a straight-on camera angle' },
  { label: 'Three-quarter', val: 'a three-quarter camera angle' },
  { label: 'Slightly above', val: 'a slightly elevated camera angle' },
];

const MANNEQUIN_FRAMING = [
  { label: 'Full garment', val: 'full garment framing' },
  { label: 'Half body', val: 'half-body framing' },
  { label: 'Detail close-up', val: 'tight detail close-up framing' },
];

const MANNEQUIN_SHADOWS = [
  { label: 'Natural contact shadow', val: 'a subtle natural contact shadow' },
  { label: 'Soft studio shadow', val: 'a soft diffused studio shadow' },
  { label: 'No visible shadow', val: 'a clean background with no visible shadow' },
];

const MANNEQUIN_STUDIO_DIRECTIONS = [
  { label: 'Studio Profesional Putih', val: 'a clean seamless white professional photo studio', icon: <PanelTop className="w-4 h-4" strokeWidth={1.8} /> },
  { label: 'Studio Gelap Dramatis', val: 'a dark dramatic professional photo studio', icon: <Box className="w-4 h-4" strokeWidth={1.8} /> },
  { label: 'Kafe Aesthetic Hangat', val: 'a warm cozy aesthetic cafe interior', icon: <Coffee className="w-4 h-4" strokeWidth={1.8} /> },
  { label: 'Bangunan Industrial Minimalis', val: 'a minimalist industrial concrete building interior', icon: <Building className="w-4 h-4" strokeWidth={1.8} /> },
  { label: 'Boutique Mewah', val: 'an elegant luxury fashion boutique interior', icon: <Diamond className="w-4 h-4" strokeWidth={1.8} /> },
];

const MANNEQUIN_LIGHTINGS = [
  { label: 'Softbox Difusi (Natural)', val: 'soft diffused 3-point softbox studio lighting', icon: '💡' },
  { label: 'Spotlight Dramatis', val: 'dramatic cinematic spotlight with deep shadows', icon: '🎬' },
  { label: 'Cahaya Jendela Hangat (Cafe)', val: 'warm natural sunlight filtering through cafe windows', icon: '🌤️' },
  { label: 'Lampu Studio Industrial', val: 'cool industrial overhead studio lighting', icon: '🔦' },
  { label: 'Golden Hour Aesthetic', val: 'warm golden hour sunlight with soft long shadows', icon: '🌅' },
];

const CATEGORIES = [
  { id: 'all', label: 'Semua', emoji: '📸' },
  { id: 'beauty', label: 'Skincare', emoji: '🧴' },
  { id: 'luxury', label: 'Mewah', emoji: '💎' },
  { id: 'marketplace', label: 'Marketplace', emoji: '🛍️' },
  { id: 'food', label: 'Makanan', emoji: '☕' },
  { id: 'fashion', label: 'Fashion', emoji: '👟' },
  { id: 'tech', label: 'Gadget', emoji: '💻' },
];

// ── Sub-components ─────────────────────────────────────

/** 
 * New PresetCard Design: 
 * Sleek, high-contrast, edge-to-edge layout inside the modal.
 */
const PresetCard: React.FC<{
  preset: PresetItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCopy: () => void;
  onApply: () => void;
  copied: boolean;
  resolvedPrompt: string;
}> = ({ preset, isExpanded, onToggleExpand, onCopy, onApply, copied, resolvedPrompt }) => (
  <motion.div
    className="bg-white border border-slate-200/70 rounded-[1.25rem] overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all duration-300"
  >
    <div className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <h3 className="font-extrabold text-slate-900 text-[15px] md:text-[16px] leading-snug flex-1">
          {preset.title}
        </h3>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0 ${preset.badgeColor}`}
        >
          {preset.badge}
        </span>
      </div>
      <p className="text-[13px] md:text-[14px] text-slate-500 font-medium mb-4 leading-relaxed">
        {preset.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {preset.tags.map((tag) => (
          <span
            key={tag}
            className="bg-slate-50 text-slate-600 border border-slate-100 text-[11px] font-bold px-2.5 py-1 rounded-lg"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Expand/collapse prompt preview */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between gap-2 text-[12px] md:text-[13px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 px-4 py-3 rounded-xl transition-colors border border-slate-100"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-400" />
          {isExpanded ? 'Tutup Detail Prompt' : 'Lihat Detail Prompt'}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expandable prompt preview */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-[12px] md:text-[13px] font-mono leading-relaxed shadow-inner">
              {resolvedPrompt}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center gap-2 px-4 pb-4 md:px-5 md:pb-5 pt-0">
      <button
        onClick={onCopy}
        className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 rounded-xl transition-all text-[13px] font-bold shrink-0"
        title="Salin Prompt"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="hidden md:inline">Tersalin</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span className="hidden md:inline">Salin</span>
          </>
        )}
      </button>

      <button
        onClick={onApply}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-xl font-bold text-[14px] transition-all shadow-md hover:shadow-lg hover:shadow-slate-900/20"
      >
        <span>Gunakan Prompt</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);

/** New OptionChip Design */
const OptionChip: React.FC<{
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  accentClass: string;
}> = ({ label, icon, isSelected, onClick, accentClass }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-3 p-3 md:p-3.5 rounded-[1.25rem] border text-left text-[13px] font-bold transition-all duration-300 min-h-[52px] md:min-h-[56px] ${
      isSelected
        ? `${accentClass} shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] scale-[0.98]`
        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
    }`}
  >
    <span className="w-5 h-5 shrink-0 flex items-center justify-center">{icon}</span>
    <span className="leading-snug">{label}</span>
    <div className={`ml-auto shrink-0 flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors ${
      isSelected ? 'border-current bg-current' : 'border-slate-300 bg-transparent'
    }`}>
      {isSelected && <Check className="w-3 h-3 text-white" />}
    </div>
  </button>
);

// ── Main Component ─────────────────────────────────────
export const PromptGeneratorModal: React.FC<PromptGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyPrompt,
  currentResolution,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'mannequin'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  // Custom builder state
  const [customProduct, setCustomProduct] = useState('Botol Serum Skincare');
  const [customPedestal, setCustomPedestal] = useState(PEDESTAL_OPTIONS[0].val);
  const [customLighting, setCustomLighting] = useState(LIGHTING_OPTIONS[0].val);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([EXTRA_EFFECTS[0].val]);

  // Mannequin builder state
  const [mqClothingType, setMqClothingType] = useState(MANNEQUIN_CLOTHING_TYPES[0].val);
  const [mqCustomClothingType, setMqCustomClothingType] = useState('');
  const [mqMaterial, setMqMaterial] = useState(MANNEQUIN_MATERIALS[0].val);
  const [mqCustomMaterial, setMqCustomMaterial] = useState('');
  const [mqColor, setMqColor] = useState('');
  const [mqPattern, setMqPattern] = useState('');
  const [mqMannequinType, setMqMannequinType] = useState(MANNEQUIN_TYPES[0].val);
  const [mqPose, setMqPose] = useState(MANNEQUIN_POSES[0].val);
  const [mqCameraAngle, setMqCameraAngle] = useState(MANNEQUIN_CAMERA_ANGLES[0].val);
  const [mqFraming, setMqFraming] = useState(MANNEQUIN_FRAMING[0].val);
  const [mqSurface, setMqSurface] = useState(MANNEQUIN_STUDIO_DIRECTIONS[0].val);
  const [mqLighting, setMqLighting] = useState(MANNEQUIN_LIGHTINGS[0].val);
  const [mqShadow, setMqShadow] = useState(MANNEQUIN_SHADOWS[0].val);
  const [mqAdditionalDetails, setMqAdditionalDetails] = useState('');
  const [mqSelectedEffects] = useState<string[]>([EXTRA_EFFECTS[0].val]);
  const [mqPromptOutput, setMqPromptOutput] = useState('');
  const [mqPromptEdited, setMqPromptEdited] = useState(false);

  // Ref for scroll container
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll and preview when tab changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setIsPreviewExpanded(false);
  }, [activeTab]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ── Handlers ──────────────────────────────────────────
  const toggleEffect = (val: string) => {
    setSelectedEffects((prev) =>
      prev.includes(val) ? prev.filter((e) => e !== val) : [...prev, val]
    );
  };


  const handleRandomizeCustom = () => {
    const randomProduct = QUICK_SUGGESTIONS[Math.floor(Math.random() * QUICK_SUGGESTIONS.length)];
    const randomPedestal = PEDESTAL_OPTIONS[Math.floor(Math.random() * PEDESTAL_OPTIONS.length)].val;
    const randomLighting = LIGHTING_OPTIONS[Math.floor(Math.random() * LIGHTING_OPTIONS.length)].val;
    const randomEffect = EXTRA_EFFECTS[Math.floor(Math.random() * EXTRA_EFFECTS.length)].val;
    setCustomProduct(randomProduct);
    setCustomPedestal(randomPedestal);
    setCustomLighting(randomLighting);
    setSelectedEffects([randomEffect]);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const customPromptText = buildCustomPromptText(
    customProduct,
    customPedestal,
    customLighting,
    selectedEffects,
    currentResolution
  );

  const mannequinPromptText = buildMannequinAutoPrompt({
    clothingType: mqClothingType === 'custom' ? mqCustomClothingType : mqClothingType,
    material: mqMaterial === 'custom' ? mqCustomMaterial : mqMaterial,
    color: mqColor,
    pattern: mqPattern,
    mannequinType: mqMannequinType,
    pose: mqPose,
    cameraAngle: mqCameraAngle,
    framing: mqFraming,
    surface: mqSurface,
    lighting: mqLighting,
    shadow: mqShadow,
    additionalDetails: mqAdditionalDetails,
    effects: mqSelectedEffects,
  }, currentResolution);

  useEffect(() => {
    if (!mqPromptEdited) setMqPromptOutput(mannequinPromptText);
  }, [mannequinPromptText, mqPromptEdited]);

  const applyPrompt = (value: string) => {
    const normalizedPrompt = value.trim();
    if (normalizedPrompt.length < 3) return;
    onApplyPrompt(normalizedPrompt);
    onClose();
  };

  const resetMannequinPrompt = () => {
    setMqPromptEdited(false);
    setMqPromptOutput(mannequinPromptText);
  };

  const filteredPresets =
    selectedCategory === 'all'
      ? PRESETS
      : PRESETS.filter((p) => p.category === selectedCategory);

  const toggleExpand = (id: string) => {
    setExpandedPresetId((prev) => (prev === id ? null : id));
  };

  // ── Render ────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-start md:pt-[5vh] justify-center p-0 md:px-4">
          {/* Backdrop (solid semi-transparent for better performance on mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-slate-900/60"
            style={{ willChange: 'opacity' }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full md:w-[95vw] lg:w-[min(768px,92vw)] h-[92dvh] md:h-[min(85vh,800px)] bg-[#f8fafc] rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-900/5"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Drag Handle (Mobile) */}
            <div className="md:hidden flex justify-center pt-4 pb-2 shrink-0 bg-white">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-4 md:py-5 flex items-center justify-between gap-3 shrink-0 bg-white border-b border-slate-100 z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-violet-500/20" />
                  <Wand2 className="w-5 h-5 relative z-10 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    AI Prompt Studio
                    <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md whitespace-nowrap uppercase tracking-wider">
                      PRO
                    </span>
                  </h2>
                  <p className="text-[12px] text-slate-500 font-medium truncate mt-0.5">
                    Formula fotografi otomatis
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors shrink-0"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector (Floating Pill Style) */}
            <div className="px-4 md:px-5 py-3 md:py-3.5 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10 sticky top-0">
              <div className="flex items-center p-1 bg-slate-100/80 rounded-2xl relative">
                {['presets', 'custom', 'mannequin'].map((tab) => {
                  const isActive = activeTab === tab;
                  const icons = {
                    presets: <Sparkles className="w-4 h-4" />,
                    custom: <Palette className="w-4 h-4" />,
                    mannequin: <ShoppingBag className="w-4 h-4" />
                  };
                  const labels = {
                    presets: 'Preset',
                    custom: 'Kustom',
                    mannequin: 'Mannequin'
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as typeof activeTab)}
                      className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[14px] font-bold text-[13px] transition-colors z-10 ${
                        isActive ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-slate-900 rounded-[14px] shadow-sm"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        {icons[tab as keyof typeof icons]}
                        <span className="truncate">{labels[tab as keyof typeof labels]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Content */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overscroll-contain bg-slate-50 relative min-h-0"
            >
              {activeTab === 'presets' ? (
                <div className="p-4 md:p-5 space-y-4">
                  {/* Category Filter */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setExpandedPresetId(null);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-300 shrink-0 border ${
                          selectedCategory === cat.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[15px]">{cat.emoji}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Presets Grid */}
                  {filteredPresets.length === 0 ? (
                    <div className="py-20 text-center">
                      <ZapOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">Tidak ada preset untuk kategori ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPresets.map((preset) => (
                        <PresetCard
                          key={preset.id}
                          preset={preset}
                          isExpanded={expandedPresetId === preset.id}
                          onToggleExpand={() => toggleExpand(preset.id)}
                          onCopy={() =>
                            handleCopy(
                              preset.id,
                              getPresetPrompt(preset.prompt, currentResolution)
                            )
                          }
                          onApply={() => {
                            applyPrompt(getPresetPrompt(preset.prompt, currentResolution));
                          }}
                          copied={copiedId === preset.id}
                          resolvedPrompt={getPresetPrompt(preset.prompt, currentResolution)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === 'custom' ? (
                /* ── Custom Builder Tab ── */
                <div className="p-4 md:p-5">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleRandomizeCustom}
                      className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-100/80 rounded-full transition-all active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Acak Kombinasi
                    </button>
                  </div>

                  {/* Step 1 */}
                  <section className="pb-5 mb-5 border-b border-slate-200/60">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] md:text-[12px] font-black">
                        1
                      </div>
                      <h3 className="text-[13px] md:text-[14px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                        Nama Produk
                      </h3>
                    </div>
                    <input
                      type="text"
                      value={customProduct}
                      onChange={(e) => setCustomProduct(e.target.value)}
                      placeholder="Contoh: Botol Serum..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-[15px] font-bold placeholder:text-slate-500 placeholder:font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                    />
                    <div className="flex flex-wrap gap-2 mt-3">
                      {QUICK_SUGGESTIONS.map((sug) => (
                        <button
                          key={sug}
                          onClick={() => setCustomProduct(sug)}
                          className={`text-[12px] font-bold px-3.5 py-2 rounded-xl transition-all ${
                            customProduct === sug
                              ? 'bg-slate-900 text-white shadow-md'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </section>

                   {/* Step 2 */}
                   <section className="pb-5 mb-5 border-b border-slate-200/60">
                     <div className="flex items-center gap-3 mb-3">
                       <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] md:text-[12px] font-black">
                         2
                       </div>
                       <h3 className="text-[13px] md:text-[14px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                         <Layers className="w-4 h-4 text-slate-400" />
                         Latar & Permukaan
                       </h3>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
                      {PEDESTAL_OPTIONS.map((item) => (
                        <OptionChip
                          key={item.label}
                          label={item.label}
                          icon={item.icon}
                          isSelected={customPedestal === item.val}
                          onClick={() => setCustomPedestal(item.val)}
                          accentClass="bg-blue-50/50 border-blue-500 text-blue-900 ring-1 ring-blue-500/20"
                        />
                      ))}
                    </div>
                  </section>

                   {/* Step 3 */}
                   <section className="pb-5 mb-5 border-b border-slate-200/60">
                     <div className="flex items-center gap-3 mb-3">
                       <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] md:text-[12px] font-black">
                         3
                       </div>
                       <h3 className="text-[13px] md:text-[14px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                         <Sun className="w-4 h-4 text-slate-400" />
                         Pencahayaan
                       </h3>
                     </div>
                     <div className="space-y-2 md:space-y-2.5">
                      {LIGHTING_OPTIONS.map((item) => (
                        <OptionChip
                          key={item.label}
                          label={item.label}
                          icon={item.icon}
                          isSelected={customLighting === item.val}
                          onClick={() => setCustomLighting(item.val)}
                          accentClass="bg-amber-50/50 border-amber-500 text-amber-900 ring-1 ring-amber-500/20"
                        />
                      ))}
                    </div>
                  </section>

                  {/* Step 4 */}
                  <section className="pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] md:text-[12px] font-black">
                          4
                        </div>
                        <h3 className="text-[13px] md:text-[14px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                          <Camera className="w-4 h-4 text-slate-400" />
                          Efek (Opsional)
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider">
                        Multi
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                      {EXTRA_EFFECTS.map((item) => {
                        const isSelected = selectedEffects.includes(item.val);
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => toggleEffect(item.val)}
                            className={`relative flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 rounded-[1rem] md:rounded-[1.25rem] border text-center transition-all duration-300 min-h-[80px] md:min-h-[88px] ${
                              isSelected
                                ? 'bg-violet-50/50 border-violet-500 text-violet-900 shadow-[0_4px_12px_-4px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/20 scale-[0.98]'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-2xl drop-shadow-sm">{item.icon}</span>
                            <span className="text-[12px] font-bold leading-tight">{item.label}</span>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-4 h-4 text-violet-600" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                   </div>
                  </section>

                </div>
              ) : (
                 /* ── Mannequin Prompt Builder Tab ── */
                 <div className="p-4 md:p-5 space-y-5">
                   <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white">
                     <div className="flex items-start gap-3">
                       <div className="rounded-xl bg-white/10 p-2 text-cyan-300"><ShoppingBag className="h-5 w-5" /></div>
                       <div>
                         <p className="text-sm font-extrabold">Mannequin image prompt</p>
                         <p className="mt-1 text-xs leading-relaxed text-slate-300">Semua pilihan di bawah akan dirangkai menjadi prompt yang dipakai untuk menghasilkan gambar di Studio.</p>
                       </div>
                     </div>
                     <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-cyan-200">
                       <span className="rounded-full bg-white/10 px-2.5 py-1">Detail garment dipertahankan</span>
                       <span className="rounded-full bg-white/10 px-2.5 py-1">Prompt editable</span>
                     </div>
                   </div>

                   <section className="border-b border-slate-200/70 pb-5">
                     <div className="mb-3 flex items-center gap-3">
                       <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">1</span>
                       <div><h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><ShoppingBag className="h-4 w-4 text-slate-400" /> Identitas pakaian</h3><p className="text-xs text-slate-500">Apa yang harus terlihat sama di hasil akhir?</p></div>
                     </div>
                     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-600">Jenis pakaian</label>
                          <select value={mqClothingType} onChange={(e) => setMqClothingType(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-bold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 mb-2">
                           {MANNEQUIN_CLOTHING_TYPES.map((type) => <option key={type.val} value={type.val}>{type.label}</option>)}
                          </select>
                          {mqClothingType === 'custom' && (
                            <input value={mqCustomClothingType} onChange={(e) => setMqCustomClothingType(e.target.value)} placeholder="Tulis jenis pakaian..." className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-bold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" autoFocus />
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-600">Bahan</label>
                          <select value={mqMaterial} onChange={(e) => setMqMaterial(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-bold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 mb-2"><option value="">Opsional</option>{MANNEQUIN_MATERIALS.map((mat) => <option key={mat.val} value={mat.val}>{mat.label}</option>)}</select>
                          {mqMaterial === 'custom' && (
                            <input value={mqCustomMaterial} onChange={(e) => setMqCustomMaterial(e.target.value)} placeholder="Tulis bahan pakaian..." className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-bold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" autoFocus />
                          )}
                        </div>
                        <label className="text-xs font-bold text-slate-600">Warna dominan
                         <input value={mqColor} onChange={(e) => setMqColor(e.target.value)} placeholder="Contoh: navy blue" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-bold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                       </label>
                       <label className="text-xs font-bold text-slate-600 sm:col-span-2">Motif atau detail penting
                         <input value={mqPattern} onChange={(e) => setMqPattern(e.target.value)} placeholder="Contoh: garis putih tipis, logo dada kiri" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-bold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                       </label>
                     </div>
                   </section>

                   <section className="border-b border-slate-200/70 pb-5">
                     <div className="mb-3 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">2</span><div><h3 className="text-sm font-extrabold text-slate-900">Mannequin & komposisi</h3><p className="text-xs text-slate-500">Tentukan cara pakaian ditampilkan.</p></div></div>
                     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                       {[['Tipe mannequin', MANNEQUIN_TYPES, mqMannequinType, setMqMannequinType], ['Pose', MANNEQUIN_POSES, mqPose, setMqPose], ['Sudut kamera', MANNEQUIN_CAMERA_ANGLES, mqCameraAngle, setMqCameraAngle], ['Framing', MANNEQUIN_FRAMING, mqFraming, setMqFraming]].map(([label, options, value, setter]) => (
                         <label key={label as string} className="text-xs font-bold text-slate-600">{label as string}<select value={value as string} onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-bold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20">{(options as {label: string; val: string}[]).map((option) => <option key={option.val} value={option.val}>{option.label}</option>)}</select></label>
                       ))}
                     </div>
                   </section>

                   <section className="border-b border-slate-200/70 pb-5">
                     <div className="mb-3 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">3</span><div><h3 className="text-sm font-extrabold text-slate-900">Arah studio</h3><p className="text-xs text-slate-500">Background, cahaya, bayangan, dan mood hasil.</p></div></div>
                     <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Layers className="h-4 w-4 text-slate-400" /> Latar Belakang</div>
                        <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{MANNEQUIN_STUDIO_DIRECTIONS.map((item) => <OptionChip key={item.label} label={item.label} icon={item.icon} isSelected={mqSurface === item.val} onClick={() => setMqSurface(item.val)} accentClass="bg-cyan-50 border-cyan-500 text-cyan-900 ring-1 ring-cyan-500/20" />)}</div>
                        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-600"><Sun className="h-4 w-4 text-slate-400" /> Pencahayaan</div><div className="grid grid-cols-1 gap-2">{MANNEQUIN_LIGHTINGS.map((item) => <OptionChip key={item.label} label={item.label} icon={item.icon} isSelected={mqLighting === item.val} onClick={() => setMqLighting(item.val)} accentClass="bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500/20" />)}</div>
                       <label className="block text-xs font-bold text-slate-600">Bayangan<select value={mqShadow} onChange={(e) => setMqShadow(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-bold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20">{MANNEQUIN_SHADOWS.map((item) => <option key={item.val} value={item.val}>{item.label}</option>)}</select></label>
                     </div>
                   </section>

                   <section>
                     <div className="mb-3 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">4</span><div><h3 className="text-sm font-extrabold text-slate-900">Instruksi tambahan</h3><p className="text-xs text-slate-500">Opsional. Tambahkan batasan yang wajib diikuti AI.</p></div></div>
                     <textarea value={mqAdditionalDetails} onChange={(e) => setMqAdditionalDetails(e.target.value)} rows={3} placeholder="Contoh: pertahankan bentuk kerah, jangan ubah posisi logo, tampilkan tekstur kain dengan jelas" className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-medium outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                   </section>
                 </div>
               )}
            </div>

            {/* Sleek Minimalist Live Preview Footer */}
            {activeTab !== 'presets' && (
              <div className="p-3 md:p-4 bg-white border-t border-slate-200/60 shrink-0 z-20 flex flex-col gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] relative">
                
                {/* Expandable Preview Area */}
                <AnimatePresence>
                  {isPreviewExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, scale: 0.95 }}
                      animate={{ height: 'auto', opacity: 1, scale: 1 }}
                      exit={{ height: 0, opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-slate-900 rounded-[1.25rem] p-3 text-white relative overflow-hidden"
                    >
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                      <div className="flex items-center justify-between mb-2 relative z-10">
                        <span className="flex items-center gap-2 text-[11px] font-black text-blue-400 font-mono uppercase tracking-widest">
                          <Sparkles className="w-3.5 h-3.5" />
                          Live Preview
                        </span>
                        <button
                          onClick={() => handleCopy(activeTab, activeTab === 'custom' ? customPromptText : mannequinPromptText)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 active:bg-white/30 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          {copiedId === activeTab ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Tersalin
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Salin
                            </>
                          )}
                        </button>
                      </div>
                       {activeTab === 'mannequin' ? (
                         <textarea
                           aria-label="Output prompt mannequin"
                           value={mqPromptOutput}
                           onChange={(event) => { setMqPromptEdited(true); setMqPromptOutput(event.target.value); }}
                           rows={5}
                           className="relative z-10 w-full resize-y rounded-xl border border-white/10 bg-black/50 p-3 text-[12px] leading-relaxed text-slate-200 outline-none focus:border-cyan-400 font-mono"
                         />
                       ) : (
                         <div className="relative z-10 max-h-[80px] overflow-y-auto rounded-xl border border-white/10 bg-black/50 p-3 text-[12px] leading-relaxed text-slate-200 scrollbar-none font-mono">
                           {customPromptText}
                         </div>
                       )}
                       {activeTab === 'mannequin' && mqPromptEdited && (
                         <button type="button" onClick={resetMannequinPrompt} className="relative z-10 mt-2 text-left text-[11px] font-bold text-cyan-300 hover:text-white">Reset ke prompt otomatis</button>
                       )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Primary Action Button & Hint */}
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                    className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors shrink-0"
                    title={isPreviewExpanded ? "Tutup Preview" : "Lihat Preview"}
                  >
                    {isPreviewExpanded ? <ChevronDown className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  </button>
                   <button
                     onClick={() => {
                       const output = activeTab === 'custom' ? customPromptText : mqPromptOutput;
                       applyPrompt(output);
                     }}
                     className="flex-1 flex items-center justify-center gap-2 h-12 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl font-extrabold text-[13px] md:text-[14px] transition-all shadow-md"
                   >
                     <Zap className="w-4 h-4" />
                     Terapkan ke Studio
                   </button>
                </div>
              </div>
            )}

            {/* Bottom Safe Area Footer */}
            <div className="px-4 md:px-5 py-2 md:py-2 bg-slate-100 border-t border-slate-200 flex justify-center shrink-0 z-30 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
              <span className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Prompt bahasa Inggris direkomendasikan
              </span>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
