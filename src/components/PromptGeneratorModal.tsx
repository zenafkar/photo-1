import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Wand2, X, Copy, Check, RefreshCw,
  ShoppingBag, Layers, Sun, Camera, CheckCircle2,
  ArrowRight, Lightbulb, ChevronDown, ChevronUp,
  Zap, Palette, ZapOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  buildCustomPromptText,
  getPresetPrompt,
  buildMannequinAutoPrompt,
  MANNEQUIN_CLOTHING_TYPES,
  MANNEQUIN_MATERIALS,
  MANNEQUIN_VIBES,
  type PresetItem,
} from '../lib/promptBuilder';

// ── Props ──────────────────────────────────────────────
interface PromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (prompt: string) => void;
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
      'Tampilan alami & segar cocok untuk produk botol serum, lotion, dan kosmetik dengan sentuhan daun botanical.',
    prompt:
      'Professional commercial product photograph of a product placed on a smooth beige stone pedestal, surrounded by soft green eucalyptus leaves and translucent water droplets, soft morning sunbeams filtering through, clean pastel background, 8k resolution, photorealistic, Vogue editorial aesthetic',
    tags: ['Soft Light', 'Botanical', 'Water Droplets', 'Pastel'],
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
    tags: ['Dark Marble', 'Gold Particles', 'Moody', 'Cinematic'],
  },
  {
    id: 'marketplace-1',
    title: 'Tokopedia & Shopee Clean Studio',
    category: 'marketplace',
    badge: 'Clean & Sharp',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    description:
      'Latar polos studio dengan softbox lighting 3-titik untuk etalase jualan yang bersih & profesional.',
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
      'Pencahayaan hangat dengan latar meja kayu rustic & efek bokeh kafe yang menggugah selera.',
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
    tags: ['Concrete', 'High Contrast', 'Urban', 'Strobe'],
  },
  {
    id: 'tech-1',
    title: 'Futuristic Cyber Tech',
    category: 'tech',
    badge: 'High Tech',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    description:
      'Pencahayaan neon cyan & magenta pada permukaan matte gelap untuk gadget & barang elektronik.',
    prompt:
      'Sleek tech product photography of product resting on a dark matte acrylic surface, futuristic neon cyan and purple ambient glow, subtle sharp reflection, modern minimalist tech aesthetic, 8k resolution, ultra-clean studio framing',
    tags: ['Neon Glow', 'Matte Acrylic', 'Cyberpunk', 'Modern'],
  },
  {
    id: 'beauty-2',
    title: 'Silk & Satin Elegance',
    category: 'beauty',
    badge: 'Elegant',
    badgeColor: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
    description:
      'Kain sutra lembut bergelombang dengan sinar lembut cocok untuk parfum & perhiasan wanita.',
    prompt:
      'Elegant product photography showcasing product nestled on flowing champagne pink silk fabric, soft gentle ambient highlights, dreamy aesthetic backdrop, ethereal lighting, high-end perfume advertisement visual',
    tags: ['Pink Silk', 'Soft Highlights', 'Dreamy', 'Parfume'],
  },
  {
    id: 'marketplace-2',
    title: 'Minimalist Scandinavian Interior',
    category: 'marketplace',
    badge: 'Lifestyle',
    badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/30',
    description:
      'Latar ruangan rumah gaya Skandinavia yang hangat untuk produk dekorasi rumah & gaya hidup.',
    prompt:
      'Lifestyle product photograph on a natural oak coffee table in a sunlit Scandinavian living room, soft cozy ambient blurred background, warm natural window light, aesthetic pastel interior tones, 8k photorealistic',
    tags: ['Lifestyle', 'Oak Wood', 'Sunlit Room', 'Nordic'],
  },
];

const QUICK_SUGGESTIONS = [
  'Botol Serum Skincare',
  'Sepatu Sneakers',
  'Jam Tangan Pria',
  'Kopi Bubuk / Drink',
  'Tas Kulit Wanita',
  'Botol Parfum',
  'Hijab & Fashion Item',
  'Earphone / Gadget',
];

const PEDESTAL_OPTIONS = [
  { label: 'Podium Marmer Hitam', val: 'a polished black marble pedestal with subtle white veining', icon: '🪨' },
  { label: 'Meja Kayu Oak Rustic', val: 'a rustic dark oak wood tabletop', icon: '🪵' },
  { label: 'Batu Beige Organik', val: 'a smooth beige natural stone pedestal', icon: '🪨' },
  { label: 'Studio Putih Polos', val: 'a seamless pure white studio surface', icon: '⬜' },
  { label: 'Akrilik Kaca Gelap', val: 'a sleek dark matte acrylic reflective surface', icon: '🪞' },
  { label: 'Kain Sutra Lembut', val: 'draped soft champagne silk fabric waves', icon: '🧵' },
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

/** Preset card with expandable prompt preview */
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
    layout
    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
  >
    {/* Card Header — always visible */}
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-extrabold text-slate-800 text-[15px] leading-snug flex-1">
          {preset.title}
        </h3>
        <span
          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${preset.badgeColor}`}
        >
          {preset.badge}
        </span>
      </div>
      <p className="text-[13px] text-slate-500 font-medium mb-3 leading-relaxed">
        {preset.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {preset.tags.map((tag) => (
          <span
            key={tag}
            className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Expand/collapse prompt preview */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between gap-2 text-[12px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2.5 rounded-xl transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {isExpanded ? 'Sembunyikan Prompt' : 'Lihat Detail Prompt'}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
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
            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-[12px] font-mono leading-relaxed border border-slate-800">
              {resolvedPrompt}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center gap-2 px-4 pb-4 pt-0">
      <button
        onClick={onCopy}
        className="flex items-center justify-center gap-1.5 px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-[13px] font-bold shrink-0"
        title="Salin Prompt"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Tersalin</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Salin</span>
          </>
        )}
      </button>

      <button
        onClick={onApply}
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[14px] shadow-sm hover:shadow-indigo-500/25 transition-all"
      >
        <span>Gunakan Prompt</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);

/** Option chip for custom builder */
const OptionChip: React.FC<{
  label: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
  accentClass: string;
}> = ({ label, icon, isSelected, onClick, accentClass }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left text-[13px] font-bold transition-all min-h-[48px] ${
      isSelected
        ? `${accentClass} border-current shadow-sm`
        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 active:bg-slate-100'
    }`}
  >
    <span className="text-lg shrink-0">{icon}</span>
    <span className="leading-snug">{label}</span>
    {isSelected && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" />}
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

  // Custom builder state
  const [customProduct, setCustomProduct] = useState('Botol Serum Skincare');
  const [customPedestal, setCustomPedestal] = useState(PEDESTAL_OPTIONS[0].val);
  const [customLighting, setCustomLighting] = useState(LIGHTING_OPTIONS[0].val);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([EXTRA_EFFECTS[0].val]);

  // Mannequin builder state
  const [mqClothingType, setMqClothingType] = useState(MANNEQUIN_CLOTHING_TYPES[0].val);
  const [mqMaterial, setMqMaterial] = useState(MANNEQUIN_MATERIALS[0].val);
  const [mqColor, setMqColor] = useState('');
  const [mqVibe, setMqVibe] = useState(MANNEQUIN_VIBES[0].val);

  // Ref for scroll container
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll when tab changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
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

  if (!isOpen) return null;

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
      // Fallback for older browsers
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
    clothingType: mqClothingType,
    material: mqMaterial,
    color: mqColor,
    vibe: mqVibe,
  }, currentResolution);

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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet / Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className="relative z-10 w-full md:max-w-lg lg:max-w-2xl max-h-[88vh] max-h-[92dvh] md:max-h-[88vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* ── Drag Handle (mobile only) ── */}
            <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* ── Header ── */}
            <div className="px-5 py-3.5 flex items-center justify-between gap-3 shrink-0 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20 shrink-0">
                  <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    AI Prompt Studio
                    <span className="text-[10px] font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                      PRO
                    </span>
                  </h2>
                  <p className="text-[12px] text-slate-500 font-medium truncate">
                    Formula prompt fotografi profesional otomatis
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Tab Selector ── */}
            <div className="px-4 py-3 flex items-center gap-2 shrink-0 bg-slate-50/80 border-b border-slate-100 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[13px] transition-all ${
                  activeTab === 'presets'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="truncate">Preset</span>
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[13px] transition-all ${
                  activeTab === 'custom'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <Palette className="w-4 h-4 shrink-0" />
                <span className="truncate">Kustom</span>
              </button>
              <button
                onClick={() => setActiveTab('mannequin')}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[13px] transition-all ${
                  activeTab === 'mannequin'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span className="truncate">Mannequin</span>
              </button>
            </div>

            {/* ── Scrollable Content ── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overscroll-contain"
            >
              {activeTab === 'presets' ? (
                <div className="p-4 space-y-4">
                  {/* Category Filter */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setExpandedPresetId(null);
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all shrink-0 ${
                          selectedCategory === cat.id
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 active:bg-slate-100'
                        }`}
                      >
                        <span className="text-[15px]">{cat.emoji}</span>
                        {cat.label}
                        {cat.id !== 'all' && (
                          <span className="text-[10px] opacity-60 ml-0.5">
                            {PRESETS.filter((p) => p.category === cat.id).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Presets Grid */}
                  {filteredPresets.length === 0 ? (
                    <div className="py-16 text-center">
                      <ZapOff className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Tidak ada preset untuk kategori ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
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
                            onApplyPrompt(getPresetPrompt(preset.prompt, currentResolution));
                            onClose();
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
                <div className="p-4 space-y-4 pb-6">
                  {/* Randomize button */}
                  <button
                    onClick={handleRandomizeCustom}
                    className="w-full flex items-center justify-center gap-2 py-3 text-[13px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all active:scale-[0.98]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    🎲 Acak Semua Kombinasi
                  </button>

                  {/* Step 1: Product Name */}
                  <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-800 uppercase tracking-wide">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black">
                        1
                      </span>
                      <ShoppingBag className="w-4 h-4 text-indigo-500" />
                      Nama Produk Anda
                    </label>
                    <input
                      type="text"
                      value={customProduct}
                      onChange={(e) => setCustomProduct(e.target.value)}
                      placeholder="Contoh: Botol Serum, Sepatu Sneakers..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base md:text-sm font-semibold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                    <div className="flex flex-wrap gap-2">
                      {QUICK_SUGGESTIONS.map((sug) => (
                        <button
                          key={sug}
                          onClick={() => setCustomProduct(sug)}
                          className={`text-[12px] font-semibold px-3 py-2 rounded-lg border transition-colors ${
                            customProduct === sug
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Step 2: Pedestal / Surface */}
                  <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-800 uppercase tracking-wide">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black">
                        2
                      </span>
                      <Layers className="w-4 h-4 text-indigo-500" />
                      Latar & Surface
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {PEDESTAL_OPTIONS.map((item) => (
                        <OptionChip
                          key={item.label}
                          label={item.label}
                          icon={item.icon}
                          isSelected={customPedestal === item.val}
                          onClick={() => setCustomPedestal(item.val)}
                          accentClass="bg-indigo-50 border-indigo-400 text-indigo-700"
                        />
                      ))}
                    </div>
                  </section>

                  {/* Step 3: Lighting */}
                  <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-800 uppercase tracking-wide">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-black">
                        3
                      </span>
                      <Sun className="w-4 h-4 text-amber-500" />
                      Mood Pencahayaan
                    </label>
                    <div className="space-y-2">
                      {LIGHTING_OPTIONS.map((item) => (
                        <OptionChip
                          key={item.label}
                          label={item.label}
                          icon={item.icon}
                          isSelected={customLighting === item.val}
                          onClick={() => setCustomLighting(item.val)}
                          accentClass="bg-amber-50 border-amber-400 text-amber-700"
                        />
                      ))}
                    </div>
                  </section>

                  {/* Step 4: Effects */}
                  <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-800 uppercase tracking-wide">
                      <span className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-black">
                        4
                      </span>
                      <Camera className="w-4 h-4 text-cyan-500" />
                      Efek Tambahan
                      <span className="text-[11px] font-medium text-slate-400 normal-case tracking-normal ml-auto">
                        Bisa pilih lebih dari satu
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {EXTRA_EFFECTS.map((item) => {
                        const isSelected = selectedEffects.includes(item.val);
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => toggleEffect(item.val)}
                            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-center transition-all min-h-[80px] ${
                              isSelected
                                ? 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 active:bg-slate-100'
                            }`}
                          >
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-[12px] font-bold leading-tight">{item.label}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Live Preview */}
                  <section className="bg-slate-900 rounded-2xl p-4 text-white space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-cyan-400 font-mono uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        Live Preview
                      </span>
                      <button
                        onClick={() => handleCopy('custom', customPromptText)}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
                      >
                        {copiedId === 'custom' ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            Tersalin
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Salin
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[13px] text-slate-200 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 font-medium">
                      {customPromptText}
                    </p>
                    <button
                      onClick={() => {
                        onApplyPrompt(customPromptText);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-xl font-bold text-[14px] transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
                    >
                      <Zap className="w-4 h-4" />
                      Terapkan Prompt Ini ke Studio
                    </button>
                  </section>
                </div>
              ) : (
                /* ── Mannequin Builder Tab ── */
                <div className="p-4 space-y-4 pb-6">
                  {/* Step 1: Clothing Type */}
                  <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-800 uppercase tracking-wide">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black">
                        1
                      </span>
                      <ShoppingBag className="w-4 h-4 text-indigo-500" />
                      Jenis Pakaian
                    </label>
                    <select
                      value={mqClothingType}
                      onChange={(e) => setMqClothingType(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base md:text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
                    >
                      {MANNEQUIN_CLOTHING_TYPES.map((type) => (
                        <option key={type.val} value={type.val}>{type.label}</option>
                      ))}
                      <option value="">Lainnya (Ketik sendiri di kolom prompt)</option>
                    </select>
                    <input
                      type="text"
                      value={mqClothingType}
                      onChange={(e) => setMqClothingType(e.target.value)}
                      placeholder="Atau ketik jenis pakaian spesifik..."
                      className="w-full mt-2 p-3.5 bg-white border border-slate-200 rounded-xl text-base md:text-sm font-semibold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </section>

                  {/* Step 2: Material & Color */}
                  <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-800 uppercase tracking-wide">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black">
                        2
                      </span>
                      <Layers className="w-4 h-4 text-indigo-500" />
                      Bahan & Warna
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <select
                          value={mqMaterial}
                          onChange={(e) => setMqMaterial(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base md:text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
                        >
                          <option value="" className="text-slate-400">-- Pilih Bahan --</option>
                          {MANNEQUIN_MATERIALS.map((mat) => (
                            <option key={mat.val} value={mat.val}>{mat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={mqColor}
                          onChange={(e) => setMqColor(e.target.value)}
                          placeholder="Warna dominan (opsional)"
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base md:text-sm font-semibold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Step 3: Studio Vibe */}
                  <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-800 uppercase tracking-wide">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black">
                        3
                      </span>
                      <Sun className="w-4 h-4 text-indigo-500" />
                      Studio Vibe
                    </label>
                    <div className="space-y-2">
                      {MANNEQUIN_VIBES.map((item) => (
                        <OptionChip
                          key={item.label}
                          label={item.label}
                          icon="📸"
                          isSelected={mqVibe === item.val}
                          onClick={() => setMqVibe(item.val)}
                          accentClass="bg-indigo-50 border-indigo-400 text-indigo-700"
                        />
                      ))}
                    </div>
                  </section>

                  {/* Live Preview */}
                  <section className="bg-slate-900 rounded-2xl p-4 text-white space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-cyan-400 font-mono uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        Live Preview
                      </span>
                      <button
                        onClick={() => handleCopy('mannequin', mannequinPromptText)}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
                      >
                        {copiedId === 'mannequin' ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            Tersalin
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Salin
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[13px] text-slate-200 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 font-medium">
                      {mannequinPromptText}
                    </p>
                    <button
                      onClick={() => {
                        onApplyPrompt(mannequinPromptText);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-xl font-bold text-[14px] transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
                    >
                      <Zap className="w-4 h-4" />
                      Terapkan Prompt Ini ke Studio
                    </button>
                  </section>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-[12px] flex items-center justify-between gap-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <span className="flex items-center gap-1.5 font-medium min-w-0 truncate">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">Gunakan prompt bahasa Inggris untuk hasil AI terbaik.</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
