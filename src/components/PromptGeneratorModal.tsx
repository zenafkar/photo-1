import React, { useState } from 'react';
import { Sparkles, Wand2, X, Copy, Check, RefreshCw, ShoppingBag, Layers, Camera, Sun, Sliders, CheckCircle2, ArrowRight, Lightbulb } from 'lucide-react';

interface PromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (prompt: string) => void;
}

interface PresetItem {
  id: string;
  title: string;
  category: 'beauty' | 'fashion' | 'food' | 'luxury' | 'tech' | 'marketplace';
  badge: string;
  badgeColor: string;
  description: string;
  prompt: string;
  tags: string[];
}

const PRESETS: PresetItem[] = [
  {
    id: 'beauty-1',
    title: 'Organic Skincare & Beauty',
    category: 'beauty',
    badge: 'High Conversion',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    description: 'Tampilan alami & segar cocok untuk produk botol serum, lotion, dan kosmetik dengan sentuhan daun botanical.',
    prompt: 'Professional commercial product photograph of a product placed on a smooth beige stone pedestal, surrounded by soft green eucalyptus leaves and translucent water droplets, soft morning sunbeams filtering through, clean pastel background, 8k resolution, photorealistic, Vogue editorial aesthetic',
    tags: ['Soft Light', 'Botanical', 'Water Droplets', 'Pastel']
  },
  {
    id: 'luxury-1',
    title: 'Luxury Dark Marble Studio',
    category: 'luxury',
    badge: 'Best Seller',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    description: 'Tampilan premium & mewah dengan marmer hitam, efek emas glowing, dan pencahayaan sinematik.',
    prompt: 'High-end luxury studio photograph of a product resting on a polished dark black marble pedestal, fine gold dust particles floating gracefully, dramatic cinematic rim light, crisp reflections, moody elegant dark backdrop, ultra-detailed 8k resolution',
    tags: ['Dark Marble', 'Gold Particles', 'Moody', 'Cinematic']
  },
  {
    id: 'marketplace-1',
    title: 'Tokopedia & Shopee Clean Studio',
    category: 'marketplace',
    badge: 'Clean & Sharp',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    description: 'Latar polos studio dengan softbox lighting 3-titik untuk etalase jualan yang bersih & profesional.',
    prompt: 'Professional studio product photo on a seamless clean white background, soft diffused 3-point softbox studio lighting, subtle soft contact shadow beneath the product, sharp focus on product details, high conversion marketplace advertisement look',
    tags: ['Pure White BG', 'Softbox Light', 'Zero Distraction']
  },
  {
    id: 'food-1',
    title: 'Warm Rustic Food & Cafe Vibe',
    category: 'food',
    badge: 'Appetizing',
    badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    description: 'Pencahayaan hangat dengan latar meja kayu rustic & efek bokeh kafe yang menggugah selera.',
    prompt: 'Commercial food photography of a product on a rustic dark oak wooden tabletop, warm ambient sunlight, shallow depth of field with beautiful cozy cafe background bokeh, scattered fresh ingredients, golden hour glow, highly detailed 8k',
    tags: ['Wood Table', 'Cozy Bokeh', 'Warm Sunlight']
  },
  {
    id: 'fashion-1',
    title: 'Streetwear & Urban Footwear',
    category: 'fashion',
    badge: 'Trending',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    description: 'Tampilan dinamis & modern untuk sepatu sneakers, tas, dan pakaian gaya anak muda.',
    prompt: 'Dynamic commercial photography of product placed on an industrial concrete podium, dramatic high-contrast studio strobe lighting, subtle motion smoke particles, sharp crisp textures, urban streetwear magazine photoshoot',
    tags: ['Concrete', 'High Contrast', 'Urban', 'Strobe']
  },
  {
    id: 'tech-1',
    title: 'Futuristic Cyber Tech',
    category: 'tech',
    badge: 'High Tech',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    description: 'Pencahayaan neon cyan & magenta pada permukaan matte gelap untuk gadget & barang elektronik.',
    prompt: 'Sleek tech product photography of product resting on a dark matte acrylic surface, futuristic neon cyan and purple ambient glow, subtle sharp reflection, modern minimalist tech aesthetic, 8k resolution, ultra-clean studio framing',
    tags: ['Neon Glow', 'Matte Acrylic', 'Cyberpunk', 'Modern']
  },
  {
    id: 'beauty-2',
    title: 'Silk & Satin Elegance',
    category: 'beauty',
    badge: 'Elegant',
    badgeColor: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
    description: 'Kain sutra lembut bergelombang dengan sinar lembut cocok untuk parfum & perhiasan wanita.',
    prompt: 'Elegant product photography showcasing product nestled on flowing champagne pink silk fabric, soft gentle ambient highlights, dreamy aesthetic backdrop, ethereal lighting, high-end perfume advertisement visual',
    tags: ['Pink Silk', 'Soft Highlights', 'Dreamy', 'Parfume']
  },
  {
    id: 'marketplace-2',
    title: 'Minimalist Scandinavian Interior',
    category: 'marketplace',
    badge: 'Lifestyle',
    badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/30',
    description: 'Latar ruangan rumah gaya Skandinavia yang hangat untuk produk dekorasi rumah & gaya hidup.',
    prompt: 'Lifestyle product photograph on a natural oak coffee table in a sunlit Scandinavian living room, soft cozy ambient blurred background, warm natural window light, aesthetic pastel interior tones, 8k photorealistic',
    tags: ['Lifestyle', 'Oak Wood', 'Sunlit Room', 'Nordic']
  }
];

const QUICK_SUGGESTIONS = [
  'Botol Serum Skincare',
  'Sepatu Sneakers',
  'Jam Tangan Pria',
  'Kopi Bubuk / Drink',
  'Tas Kulit Wanita',
  'Botol Parfum',
  'Hijab & Fashion Item',
  'Earphone / Gadget'
];

const PEDESTAL_OPTIONS = [
  { label: 'Podium Marmer Hitam', val: 'a polished black marble pedestal with subtle white veining' },
  { label: 'Meja Kayu Oak Rustic', val: 'a rustic dark oak wood tabletop' },
  { label: 'Batu Beige Organik', val: 'a smooth beige natural stone pedestal' },
  { label: 'Studio Putih Polos', val: 'a seamless pure white studio surface' },
  { label: 'Akrilik Kaca Gelap', val: 'a sleek dark matte acrylic reflective surface' },
  { label: 'Kain Sutra Lembut', val: 'draped soft champagne silk fabric waves' }
];

const LIGHTING_OPTIONS = [
  { label: 'Studio Softbox Diffused', val: 'soft diffused 3-point softbox studio lighting' },
  { label: 'Cinematic Spotlight & Gold Glow', val: 'dramatic cinematic spotlight with golden rim light' },
  { label: 'Sinar Matahari Pagi (Sunbeam)', val: 'natural warm sunbeams filtering through window blinds' },
  { label: 'Neon Cyberpunk (Cyan/Purple)', val: 'futuristic dual neon cyan and violet ambient lighting' },
  { label: 'Golden Hour Sunset Vibe', val: 'warm golden hour sunlight with soft long shadows' }
];

const EXTRA_EFFECTS = [
  { label: 'Debu Emas Glowing', val: 'subtle floating gold dust sparkle particles' },
  { label: 'Embun & Cipratan Air', val: 'fresh water droplets and subtle water splash ripples' },
  { label: 'Daun Botanical & Bayangan', val: 'soft green eucalyptus leaves with gentle leaf shadow overlay' },
  { label: 'Bokeh Latar Belakang Kafe', val: 'cozy ambient background bokeh blur' },
  { label: 'Asap Tipis Sinematik', val: 'subtle ethereal smoke mist in the background' }
];

export const PromptGeneratorModal: React.FC<PromptGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom builder states
  const [customProduct, setCustomProduct] = useState<string>('Botol Serum Skincare');
  const [customPedestal, setCustomPedestal] = useState<string>(PEDESTAL_OPTIONS[0].val);
  const [customLighting, setCustomLighting] = useState<string>(LIGHTING_OPTIONS[0].val);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([EXTRA_EFFECTS[0].val]);

  if (!isOpen) return null;

  const toggleEffect = (val: string) => {
    if (selectedEffects.includes(val)) {
      setSelectedEffects(selectedEffects.filter(e => e !== val));
    } else {
      setSelectedEffects([...selectedEffects, val]);
    }
  };

  // Build the custom prompt live
  const buildCustomPromptText = () => {
    const prodName = customProduct.trim() || 'product';
    const effectsText = selectedEffects.length > 0 ? `, with ${selectedEffects.join(', ')}` : '';
    return `Professional commercial product photography of ${prodName}, placed on ${customPedestal}, lit with ${customLighting}${effectsText}, 8k resolution, ultra sharp detail, high conversion e-commerce ad photo`;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  const filteredPresets = PRESETS.filter(p => selectedCategory === 'all' || p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 text-white flex items-center justify-between relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                AI Auto Prompt Generator
                <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  PRODUK JUALAN
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Formula prompt studio fotografi profesional untuk tingkatkan daya tarik konsumen & penjualan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'presets'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Preset Foto Siap pakai ({PRESETS.length})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'custom'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Kustom Prompt Builder
            </button>
          </div>

          {activeTab === 'custom' && (
            <button
              onClick={handleRandomizeCustom}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Acak Kombinasi
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'presets' ? (
            <div className="space-y-5">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { id: 'all', label: 'Semua Preset' },
                  { id: 'beauty', label: '🧴 Skincare & Beauty' },
                  { id: 'luxury', label: '💎 Mewah & Perhiasan' },
                  { id: 'marketplace', label: '🛍️ Marketplace Clean' },
                  { id: 'food', label: '☕ Makanan & Minuman' },
                  { id: 'fashion', label: '👟 Fashion & Sepatu' },
                  { id: 'tech', label: '💻 Gadget & Elektronik' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid Presets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-extrabold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">
                          {preset.title}
                        </h3>
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mb-3">
                        {preset.description}
                      </p>

                      {/* Prompt Display */}
                      <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono line-clamp-3 mb-3 border border-slate-800 leading-relaxed relative">
                        {preset.prompt}
                      </div>

                      {/* Tag Chips */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {preset.tags.map((tag) => (
                          <span key={tag} className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleCopy(preset.id, preset.prompt)}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center justify-center text-xs font-bold gap-1"
                        title="Salin Prompt"
                      >
                        {copiedId === preset.id ? (
                          <><Check className="w-4 h-4 text-emerald-600" /> Tersalin!</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Salin</>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onApplyPrompt(preset.prompt);
                          onClose();
                        }}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        Gunakan Prompt Ini
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Custom Builder Tab */
            <div className="space-y-6">
              
              {/* Product Name Input */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-indigo-500" />
                  1. Nama / Jenis Produk Anda
                </label>
                <input
                  type="text"
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value)}
                  placeholder="Contoh: Botol Serum Skincare, Sepatu Sneakers, Jam Tangan..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-bold text-slate-400">Saran Cepat:</span>
                  {QUICK_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => setCustomProduct(sug)}
                      className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pedestal / Surface */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  2. Latar Belakang / Surface Pedestal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PEDESTAL_OPTIONS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setCustomPedestal(item.val)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        customPedestal === item.val
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lighting */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  3. Mood Pencahayaan (Lighting Studio)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LIGHTING_OPTIONS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setCustomLighting(item.val)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        customLighting === item.val
                          ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Effects */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-500" />
                  4. Efek Estetika Tambahan (Opsional)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {EXTRA_EFFECTS.map((item) => {
                    const isSelected = selectedEffects.includes(item.val);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => toggleEffect(item.val)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-900 p-5 rounded-2xl text-white space-y-3 shadow-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Live Generated Prompt Result
                  </span>
                  <button
                    onClick={() => handleCopy('custom-live', buildCustomPromptText())}
                    className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 font-bold"
                  >
                    {copiedId === 'custom-live' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'custom-live' ? 'Tersalin' : 'Salin Text'}
                  </button>
                </div>
                <p className="font-mono text-xs text-slate-200 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                  {buildCustomPromptText()}
                </p>
                <button
                  onClick={() => {
                    onApplyPrompt(buildCustomPromptText());
                    onClose();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Terapkan Prompt Kustom ke Studio
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 text-slate-500 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Tips: Gunakan prompt bahasa Inggris untuk hasil kualitas AI terbaik.
          </span>
          <button
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
