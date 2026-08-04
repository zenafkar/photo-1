import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Sparkles,
  Smartphone,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Sliders,
  Wand2,
  CheckCircle2,
  Banana
} from 'lucide-react';
import { SignedOut, SignedIn, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const OpenAIIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.103 8.3685v-2.333a.0804.0804 0 0 1 .0332-.0615l4.8729-2.815a4.4992 4.4992 0 0 1 6.1408 1.6464 4.4708 4.4708 0 0 1 .5346 3.0137l-.1419-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0zM22.004 14.225a4.485 4.485 0 0 1-2.3655 1.9728V10.511a.7664.7664 0 0 0-.3879-.6765L13.4362 6.4802l2.0201-1.1685a.0757.0757 0 0 1 .071 0l4.8303 2.7866a4.504 4.504 0 0 1-2.3536 6.1268zM12 15.1585l-3.2372-1.8693v-3.7386L12 7.6813l3.2372 1.8693v3.7386z"/>
  </svg>
);

const InteractiveSandbox = () => {
  const { openSignIn, openSignUp } = useClerk();
  const handleOpenAuth = () => {
    try {
      if (typeof openSignUp === 'function') {
        openSignUp({ fallbackRedirectUrl: '/studio', signInFallbackRedirectUrl: '/studio' });
      } else if (typeof openSignIn === 'function') {
        openSignIn({ fallbackRedirectUrl: '/studio', signUpFallbackRedirectUrl: '/studio' });
      }
    } catch (e) {
      console.error("Auth modal error:", e);
    }
  };
  const styles = [
    {
      id: 'nanobananapro',
      name: 'Nano Banana Pro',
      subtitle: 'Engine Premium 4K Ultra HD',
      prompt: 'Menggunakan AI model Pro untuk detail super tajam dan pencahayaan layaknya studio profesional.',
      icon: <Banana className="w-4 h-4 text-amber-400" />,
      beforeImage: '/mystic-before.jpg',
      afterImage: '/mystic-after.jpg',
      tag: 'ULTRA HD'
    },
    {
      id: 'nanobanana2',
      name: 'Nano Banana 2',
      subtitle: 'Cepat & Resolusi Tinggi',
      prompt: 'Menggunakan AI engine standar yang sangat cepat untuk kebutuhan gambar sosial media sehari-hari.',
      icon: <Banana className="w-4 h-4 text-sky-400" />,
      beforeImage: '/mystic-before.jpg',
      afterImage: '/mystic-after.jpg',
      tag: 'CEPAT'
    },
    {
      id: 'gptimage',
      name: 'OpenAI GPT-Image',
      subtitle: 'Standar Industri Terkini',
      prompt: 'Menggunakan model tercanggih dari OpenAI (GPT-Image 1.5) untuk hasil paling fotorealistik dan akurat.',
      icon: <OpenAIIcon className="w-4 h-4 text-emerald-400" />,
      beforeImage: '/fanta-before.jpg',
      afterImage: '/fanta-after.jpg',
      tag: 'REALISTIK'
    }
  ];

  const [activeStyle, setActiveStyle] = useState(styles[0]);

  // Animation State
  const revealProgress = useMotionValue(50);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const controls = animate(revealProgress, [10, 90, 90, 10, 10], {
      duration: 7,
      times: [0, 0.4, 0.5, 0.9, 1],
      repeat: Infinity,
      ease: "easeInOut"
    });
    return () => controls.stop();
  }, [isHovered, revealProgress, activeStyle]);

  const handleStyleClick = (style: typeof styles[0]) => {
    if (style.id === activeStyle.id) return;
    setActiveStyle(style);
    setIsHovered(true);
    animate(revealProgress, 90, { duration: 0.8, ease: "easeOut" }).then(() => {
      setTimeout(() => setIsHovered(false), 800);
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isHovered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    revealProgress.set(percentage);
  };

  const handlePointerEnter = () => setIsHovered(true);
  const handlePointerLeave = () => setIsHovered(false);

  const clipPathValue = useTransform(revealProgress, (val) => `inset(0 0 0 ${val}%)`);
  const lineLeftValue = useTransform(revealProgress, (val) => `${val}%`);

  const steps = [
    {
      icon: Smartphone,
      title: "Foto Kamera HP",
      desc: "Foto biasa dengan pencahayaan minim & background seadanya",
      color: "border-surface-border bg-black/40 text-text-muted"
    },
    {
      icon: Cpu,
      title: "AI Neural Studio Engine",
      desc: "Rekonstruksi background & pencahayaan tanpa mengaburkan produk",
      color: "border-secondary/40 bg-secondary/10 text-secondary"
    },
    {
      icon: ShieldCheck,
      title: "Hasil 4K Autentik",
      desc: "Kualitas foto studio komersial dengan garansi produk asli 100%",
      color: "border-primary/40 bg-primary/10 text-primary"
    }
  ];

  return (
    <div className="relative overflow-hidden text-text">
      {/* Glow Backdrops */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,69,42,0.04)_0%,transparent_70%)] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(61,139,125,0.04)_0%,transparent_70%)] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Side Content */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {/* Top Pill */}
            <div className="inline-flex items-center self-start gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-surface-border text-xs font-semibold text-primary mb-6">
              <Wand2 className="w-3.5 h-3.5" />
              <span>INTERACTIVE AI SANDBOX</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 text-text leading-tight">
              Masuk Kualitas HP,<br />
              <span className="bg-gradient-to-r from-primary via-amber-400 to-secondary bg-clip-text text-transparent">
                Keluar Kualitas Studio.
              </span>
            </h2>

            {/* Infographic Steps Cards */}
            <div className="space-y-3 mb-8">
              {steps.map((step, idx) => {
                const IconComp = step.icon;
                return (
                  <div key={idx} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface/40 border border-surface-border hover:border-primary/30 transition-all">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${step.color}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
                        {step.title}
                        {idx === 2 && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </h3>
                      <p className="text-xs text-text-muted leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Style Selector Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-secondary" />
                  ENGINE RUNNING BY:
                </span>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                {styles.map(style => {
                  const isActive = activeStyle.id === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => handleStyleClick(style)}
                      className={`flex items-center justify-between w-full sm:w-auto p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-secondary/10 border-secondary/50'
                          : 'bg-surface/40 border-surface-border hover:border-surface-border text-text-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${isActive ? 'bg-secondary/20 border-secondary/40' : 'bg-black/20 border-surface-border'}`}>
                          {style.icon}
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${isActive ? 'text-secondary' : 'text-text'}`}>
                            {style.name}
                          </div>
                          <div className="text-[10px] text-text-muted">{style.subtitle}</div>
                        </div>
                      </div>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-secondary animate-ping ml-4" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <SignedOut>
                <button
                  onClick={handleOpenAuth}
                  className="w-full sm:w-auto px-7 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(212,69,42,0.3)] hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Coba Sekarang
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignedOut>
              <SignedIn>
                <Link to="/studio" className="w-full sm:w-auto px-7 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(212,69,42,0.3)] hover:scale-[1.02] active:scale-95 cursor-pointer">
                  <Sparkles className="w-4 h-4" />
                  Masuk Studio
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </SignedIn>
              <span className="text-xs text-text-muted font-mono">⚡ Dapat 3 foto gratis!</span>
            </div>
          </div>

          {/* Right Side Card (Interactive Before/After AI Sandbox) */}
          <div className="lg:col-span-7 bg-surface/40 border border-surface-border rounded-3xl p-5 md:p-6 relative group">
            {/* Corner Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle,rgba(212,69,42,0.06)_0%,transparent_70%)] rounded-full transition-all pointer-events-none" />

            {/* Prompt Console Bar */}
            <div className="flex items-center justify-between mb-3 text-xs font-mono text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                PROMPT COMMAND TERMINAL:
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/10 border border-secondary/30 text-secondary">
                {activeStyle.tag}
              </span>
            </div>

            <div className="bg-black/50 rounded-xl p-3.5 border border-surface-border mb-4 font-mono text-xs text-text leading-relaxed shadow-inner">
              <span className="text-secondary font-bold">&gt; </span>
              <span className="text-text">"{activeStyle.prompt}"</span>
            </div>

            {/* Interactive Before/After Image Slider */}
            <div
              className="rounded-2xl overflow-hidden relative bg-black isolate border border-surface-border cursor-ew-resize select-none touch-pan-y shadow-2xl"
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
              onPointerDown={handlePointerEnter}
              onPointerUp={handlePointerLeave}
              onPointerCancel={handlePointerLeave}
              onPointerMove={handlePointerMove}
            >
              {/* Layer 1: BEFORE Image */}
              <img
                src={activeStyle.beforeImage}
                alt="Foto Mentah Asli"
                width={1086}
                height={1448}
                loading="lazy"
                className="block w-full h-auto object-cover select-none pointer-events-none"
              />

              {/* Layer 2: AFTER Image */}
              <motion.div
                className="absolute inset-0 overflow-hidden z-10 pointer-events-none select-none"
                style={{ clipPath: clipPathValue }}
              >
                <img
                  src={activeStyle.afterImage}
                  alt={activeStyle.name}
                  width={1086}
                  height={1448}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </motion.div>

              {/* Layer 3: Laser Slider Handle Line */}
              <motion.div
                className="absolute top-0 bottom-0 w-[3px] bg-secondary shadow-[0_0_15px_rgba(61,139,125,0.7)] z-20 pointer-events-none"
                style={{ left: lineLeftValue }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-12 bg-black/90 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center border border-secondary/60">
                  <svg className="w-5 h-5 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3"/>
                  </svg>
                </div>
              </motion.div>

              {/* Layer 4: Badges */}
              <div className="absolute top-4 left-4 z-30 pointer-events-none">
                <div className="px-3 py-1.5 bg-black/85 backdrop-blur-md text-text-muted text-[10px] font-mono font-bold rounded-lg shadow-md tracking-wider flex items-center gap-1.5 border border-surface-border">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  📷 RAW HP INPUT
                </div>
              </div>

              <div className="absolute top-4 right-4 z-30 pointer-events-none">
                <div className="px-3 py-1.5 bg-black/85 backdrop-blur-md text-secondary text-[10px] font-mono font-bold rounded-lg shadow-md tracking-wider flex items-center gap-1.5 border border-secondary/40">
                  <Sparkles className="w-3 h-3 text-secondary" />
                  ✨ AI 4K RENDER
                </div>
              </div>

              {/* Bottom Real-time AI Status Indicator */}
              <div className="absolute bottom-4 inset-x-4 z-30 pointer-events-none flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-surface-border text-[10px] font-mono text-text-muted">
                <span>GESER UNTUK MEMBANDINGKAN</span>
                <span className="text-secondary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  AUTHENTICITY: 100%
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InteractiveSandbox;
