import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { StaggerContainer, StaggerItem } from './ScrollReveal';
import { SignedOut, SignedIn, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ShopeeIcon, TokopediaIcon, TikTokIcon, InstagramIcon } from './MarketplaceIcons';

const HeroInteractiveDemo = () => {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [interacted, setInteracted] = useState(false);
  const [activeSet, setActiveSet] = useState<0|1>(0); // 0: mystic, 1: fanta

  useEffect(() => {
    if (interacted) return;
    const cycle = () => {
      setStep(0);
      setTimeout(() => setStep(1), 1500);
      setTimeout(() => setStep(2), 3500);
    };
    cycle();
    const interval = setInterval(cycle, 7000);
    return () => clearInterval(interval);
  }, [interacted]);

  const handleGenerateClick = () => {
    setInteracted(true);
    if (step === 2 || step === 1) {
      setStep(0);
      setActiveSet(prev => prev === 0 ? 1 : 0);
      setTimeout(() => setStep(1), 300);
      setTimeout(() => setStep(2), 2300);
    } else {
      setStep(1);
      setTimeout(() => setStep(2), 2000);
    }
  };

  const images = [
    { before: '/mystic-before.jpg', after: '/mystic-after.jpg' },
    { before: '/fanta-before.jpg', after: '/fanta-after.jpg' }
  ];

  return (
    <div className="relative w-full max-w-[400px] mx-auto bg-surface/60 backdrop-blur-sm border border-surface-border rounded-3xl p-4 sm:p-5 overflow-hidden group">
      {/* Subtle warm glow inside demo */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(212,69,42,0.12)_0%,transparent_70%)] pointer-events-none rounded-full" />

      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 sm:mb-5 relative z-10">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-surface-border flex items-center justify-center">
            <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-red-500"></span>
          </span>
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-surface-border flex items-center justify-center">
            <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-500"></span>
          </span>
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-surface-border flex items-center justify-center">
            <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-500"></span>
          </span>
        </div>
        <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          LIVE PREVIEW
        </span>
      </div>

      {/* Image Area — larger for editorial feel */}
      <div
        className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-black mb-4 sm:mb-5 border border-surface-border isolate cursor-pointer shadow-inner"
        onClick={handleGenerateClick}
      >
        {/* Before Image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={`before-${activeSet}`}
            src={images[activeSet].before}
            alt="Foto produk mentah"
            width={440} height={550}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        </AnimatePresence>

        {/* After Image */}
        <motion.div
          className="absolute inset-0 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: step === 2 ? 1 : 0 }}
          transition={{ duration: 0.8 }}
        >
          <img src={images[activeSet].after} alt="Hasil foto studio AI" width={440} height={550} loading="lazy" className="w-full h-full object-cover" />
        </motion.div>

        {/* Scanning Line — the "developing" metaphor */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div
              className="absolute top-0 left-0 right-0 h-[2px] bg-primary z-20 shadow-[0_0_15px_rgba(212,69,42,0.7)]"
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: [0, 420, 420], opacity: [0, 1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "linear", repeat: Infinity }}
              style={{ willChange: 'transform' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-24 bg-gradient-to-b from-transparent to-primary/20" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay Badges */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-30">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-md transition-all shadow-lg border ${step === 2 ? 'bg-primary text-white border-primary-dark' : 'bg-black/60 text-text border-surface-border'}`}>
            {step === 2 ? '✨ 4K STUDIO RENDER' : '📷 RAW CAMERA'}
          </span>
        </div>

        {/* CTA Overlay when idle */}
        {step === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 active:opacity-100 transition-opacity z-20">
            <span className="bg-primary text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-[0_0_20px_rgba(212,69,42,0.4)]">
              Klik untuk Generate
            </span>
          </div>
        )}
      </div>

      {/* Prompt Controls */}
      <div className="flex gap-2 sm:gap-3">
        <div className="flex-1 bg-black/50 border border-surface-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs text-text-muted flex items-center overflow-hidden shadow-inner font-mono">
          <span className="text-primary font-bold mr-2">&gt;</span>
          <span className="truncate text-text">
            {step === 0 ? "Menunggu input prompt..." : step === 1 ? "Generating studio lighting..." : "Cinematic studio lighting, 4K, photorealistic"}
          </span>
          {step === 1 && <span className="w-1.5 h-4 bg-primary ml-1 animate-pulse shrink-0" />}
        </div>
        <button
          onClick={handleGenerateClick}
          disabled={step === 1}
          className="bg-primary hover:bg-primary-dark disabled:bg-surface-border disabled:text-text-muted text-white font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,69,42,0.3)] hover:shadow-[0_6px_25px_rgba(212,69,42,0.45)] min-w-[100px] sm:min-w-[120px]"
        >
          {step === 1 ? <Cpu className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {step === 1 ? 'Proses' : 'Generate'}
        </button>
      </div>
    </div>
  );
};

const Hero = () => {
  const { openSignIn, openSignUp } = useClerk();
  const trustItems = [
    { icon: Sparkles, label: "3 Foto Gratis", sub: "Tanpa kartu kredit" },
    { icon: ShieldCheck, label: "Produk 100% Asli", sub: "Bentuk & warna terjaga" },
  ];

  return (
    <section data-component="hero" className="relative pt-20 pb-12 sm:pt-28 sm:pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-background text-text isolate border-b border-surface-border">
      {/* Soft background glows — warm, darkroom atmosphere */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[200px] -left-[200px] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(212,69,42,0.08)_0%,transparent_60%)] rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 -right-[200px] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(61,139,125,0.06)_0%,transparent_60%)] rounded-full blur-3xl opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">

          {/* Left Column: Editorial text & CTAs */}
          <StaggerContainer className="text-center lg:text-left">
            {/* Top Badge — restrained */}
            <StaggerItem>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-surface-border text-xs font-medium text-text-muted mb-6 sm:mb-8">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Product Integrity Guarantee™</span>
              </div>
            </StaggerItem>

            {/* Main Headline — Cormorant Garamond, editorial */}
            <StaggerItem>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-text mb-4 sm:mb-6 leading-[1.15]">
                Foto Produk Studio,<br />
                <span className="text-primary italic">
                  Tanpa Studio.
                </span>
              </h1>
            </StaggerItem>

            {/* Subtitle */}
            <StaggerItem>
              <p className="text-base sm:text-lg text-text-muted max-w-lg mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed">
                AI kami ubah foto HP biasa jadi foto produk profesional — background bebas diubah,{" "}
                <strong className="text-text font-semibold">bentuk & warna asli produk dijamin 100% aman</strong>. Siap upload ke e-commerce.
              </p>

              {/* Marketplace Tags — cleaner */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mb-6 sm:mb-8">
                <span className="text-xs text-text-muted font-medium mr-1">Dimaksimalkan untuk:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FF5722]/10 border border-[#FF5722]/20 text-[#FF5722] text-xs font-semibold">
                  <ShopeeIcon className="w-3.5 h-3.5" />
                  Shopee
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-surface-border text-white text-xs font-semibold">
                  <TikTokIcon className="w-3.5 h-3.5" />
                  TikTok Shop
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#42B549]/10 border border-[#42B549]/20 text-[#42B549] text-xs font-semibold">
                  <TokopediaIcon className="w-3.5 h-3.5" />
                  Tokopedia
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E1306C]/10 border border-[#E1306C]/20 text-[#E1306C] text-xs font-semibold">
                  <InstagramIcon className="w-3.5 h-3.5" />
                  Instagram
                </span>
              </div>
            </StaggerItem>

            {/* CTA Buttons */}
            <StaggerItem>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
                <SignedOut>
                  <button
                    onClick={() => {
                      try {
                        if (typeof openSignUp === 'function') {
                          openSignUp({ fallbackRedirectUrl: '/studio', signInFallbackRedirectUrl: '/studio' });
                        } else if (typeof openSignIn === 'function') {
                          openSignIn({ fallbackRedirectUrl: '/studio', signUpFallbackRedirectUrl: '/studio' });
                        }
                      } catch (e) {
                        console.error("Auth modal error:", e);
                      }
                    }}
                    className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2.5 shadow-[0_4px_25px_rgba(212,69,42,0.35)] hover:shadow-[0_6px_35px_rgba(212,69,42,0.5)] hover:scale-[1.02] active:scale-95 cursor-pointer min-h-[52px]"
                  >
                    <Sparkles className="w-5 h-5" />
                    Coba Gratis — 3 Foto
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </SignedOut>
                <SignedIn>
                  <Link to="/studio" className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2.5 shadow-[0_4px_25px_rgba(212,69,42,0.35)] hover:shadow-[0_6px_35px_rgba(212,69,42,0.5)] hover:scale-[1.02] active:scale-95 cursor-pointer min-h-[52px]">
                    <Sparkles className="w-5 h-5" />
                    Masuk Studio
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </SignedIn>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* Right Column: Interactive Demo — the visual anchor */}
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <HeroInteractiveDemo />
            </motion.div>
          </div>
        </div>

        {/* Trust Strip */}
        <div className="mt-16 sm:mt-20 lg:mt-24">
          {/* Trust Stats Row — restrained, editorial */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
            {trustItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface/40 border border-surface-border">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/10 text-primary shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-text">{item.label}</div>
                    <div className="text-xs text-text-muted">{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
