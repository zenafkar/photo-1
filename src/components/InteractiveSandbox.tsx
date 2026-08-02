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
      icon: <Banana className="w-4 h-4 text-cyan-400" />,
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
  const revealProgress = useMotionValue(50); // initial 50% split
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    // Cinematic loop animation: 10% -> 90% -> 90% -> 10%
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
    // Smooth transition reveal to show off the new style
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

  // Derived values for clipPath and handle placement
  const clipPathValue = useTransform(revealProgress, (val) => `inset(0 0 0 ${val}%)`);
  const lineLeftValue = useTransform(revealProgress, (val) => `${val}%`);

  const steps = [
    {
      icon: Smartphone,
      title: "Foto Kamera HP",
      desc: "Foto biasa dengan pencahayaan minim & background seadanya",
      color: "border-slate-700 bg-slate-900/60 text-slate-400"
    },
    {
      icon: Cpu,
      title: "AI Neural Studio Engine",
      desc: "Rekonstruksi background & pencahayaan tanpa mengaburkan produk",
      color: "border-cyan-500/40 bg-cyan-950/40 text-cyan-400"
    },
    {
      icon: ShieldCheck,
      title: "Hasil 4K Autentik",
      desc: "Kualitas foto studio komersial dengan garansi produk asli 100%",
      color: "border-emerald-500/40 bg-emerald-950/40 text-emerald-400"
    }
  ];

  return (
    <section className="bg-slate-950 py-16 md:py-24 border-t border-slate-800/80 relative overflow-hidden text-white" id="fitur">
      {/* Glow Backdrops */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[radial-gradient(circle,rgba(8,145,178,0.15)_0%,transparent_70%)] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(79,70,229,0.15)_0%,transparent_70%)] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Side Content */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {/* Top Pill */}
            <div className="inline-flex items-center self-start gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Wand2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>INTERACTIVE AI TRANSFORM SANDBOX</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6 text-white leading-tight">
              Masuk Kualitas HP,<br />
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                Keluar Kualitas Studio.
              </span>
            </h2>

            {/* Infographic Steps Cards */}
            <div className="space-y-3 mb-8">
              {steps.map((step, idx) => {
                const IconComp = step.icon;
                return (
                  <div key={idx} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${step.color}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        {step.title}
                        {idx === 2 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Style Selector Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
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
                          ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${isActive ? 'bg-cyan-500/20 border-cyan-500/40' : 'bg-slate-800 border-slate-700'}`}>
                          {style.icon}
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {style.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{style.subtitle}</div>
                        </div>
                      </div>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-4" />
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
                  className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                  Coba Sekarang
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignedOut>
              <SignedIn>
                <Link to="/studio" className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95 cursor-pointer">
                  <Sparkles className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                  Masuk Studio
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </SignedIn>
              <span className="text-xs text-slate-400 font-mono">⚡ Dapat 3 foto gratis!</span>
            </div>
          </div>

          {/* Right Side Card (Interactive Before/After AI Sandbox) */}
          <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl p-5 md:p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-cyan-500/20 backdrop-blur-xl relative group">
            {/* Cyber Corner Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle,rgba(6,182,212,0.15)_0%,transparent_70%)] group-hover:bg-[radial-gradient(circle,rgba(6,182,212,0.25)_0%,transparent_70%)] rounded-full transition-all pointer-events-none" />

            {/* Prompt Console Bar */}
            <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                PROMPT COMMAND TERMINAL:
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                {activeStyle.tag}
              </span>
            </div>
            
            <div className="bg-slate-950/90 rounded-xl p-3.5 border border-slate-800 mb-4 font-mono text-xs text-slate-300 leading-relaxed shadow-inner">
              <span className="text-cyan-400 font-bold">&gt; </span>
              <span className="text-slate-200">"{activeStyle.prompt}"</span>
            </div>
            
            {/* Interactive Before/After Image Slider */}
            <div 
              className="rounded-2xl overflow-hidden relative bg-slate-950 isolate border border-slate-800 cursor-ew-resize select-none touch-pan-y shadow-2xl"
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
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </motion.div>
              
              {/* Layer 3: Laser Slider Handle Line */}
              <motion.div 
                className="absolute top-0 bottom-0 w-[3px] bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.9)] z-20 pointer-events-none"
                style={{ left: lineLeftValue }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-12 bg-slate-900/90 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center border border-cyan-400/60">
                  <svg className="w-5 h-5 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3"/>
                  </svg>
                </div>
              </motion.div>
              
              {/* Layer 4: Badges */}
              <div className="absolute top-4 left-4 z-30 pointer-events-none">
                <div className="px-3 py-1.5 bg-slate-950/85 backdrop-blur-md text-slate-300 text-[10px] font-mono font-bold rounded-lg shadow-md tracking-wider flex items-center gap-1.5 border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  📷 RAW HP INPUT
                </div>
              </div>

              <div className="absolute top-4 right-4 z-30 pointer-events-none">
                <div className="px-3 py-1.5 bg-slate-950/85 backdrop-blur-md text-cyan-300 text-[10px] font-mono font-bold rounded-lg shadow-md tracking-wider flex items-center gap-1.5 border border-cyan-500/40">
                  <Sparkles className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                  ✨ AI 4K RENDER
                </div>
              </div>

              {/* Bottom Real-time AI Status Indicator */}
              <div className="absolute bottom-4 inset-x-4 z-30 pointer-events-none flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-400">
                <span>GESER UNTUK MEMBANDINGKAN</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  AUTHENTICITY: 100%
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveSandbox;

