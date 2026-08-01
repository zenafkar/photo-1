import { 
  ArrowRight, 
  Image as ImageIcon, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  Check,
  Wand2
} from 'lucide-react';
import { StaggerContainer, StaggerItem } from './ScrollReveal';
import { SignInButton, SignedOut, SignedIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const HeroInteractiveDemo = () => {
  const [step, setStep] = useState<0 | 1 | 2>(0); 
  // 0: Before, 1: Scanning, 2: After
  const [interacted, setInteracted] = useState(false);

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
      setTimeout(() => setStep(1), 300);
      setTimeout(() => setStep(2), 2300);
    } else {
      setStep(1);
      setTimeout(() => setStep(2), 2000);
    }
  };

  return (
    <div className="relative w-full max-w-[480px] mx-auto lg:ml-auto bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-5 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden group">
      {/* Background Glow inside demo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_70%)] pointer-events-none rounded-full" />
      
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5 relative z-10">
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-red-500/80"></span></span>
            <span className="w-3 h-3 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500/80"></span></span>
            <span className="w-3 h-3 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500/80"></span></span>
         </div>
         <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-1 rounded flex items-center gap-1.5">
           <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
           LIVE PREVIEW
         </span>
      </div>

      {/* Image Area */}
      <div 
        className="relative aspect-square sm:aspect-[4/5] lg:aspect-square rounded-2xl overflow-hidden bg-slate-950 mb-5 border border-slate-700/50 isolate cursor-pointer shadow-inner" 
        onClick={handleGenerateClick}
      >
         {/* Before Image */}
         <img src="/mystic-before.jpg" alt="Raw Photo" className="absolute inset-0 w-full h-full object-cover" />
         
         {/* After Image */}
         <motion.div 
            className="absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: step === 2 ? 1 : 0 }}
            transition={{ duration: 0.8 }}
         >
           <img src="/mystic-after.jpg" alt="Studio Photo" className="w-full h-full object-cover" />
         </motion.div>

         {/* Scanning Line Effect */}
         <AnimatePresence>
           {step === 1 && (
             <motion.div 
               className="absolute left-0 right-0 h-[2px] bg-cyan-400 z-20"
               initial={{ top: "0%", opacity: 0 }}
               animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
               exit={{ opacity: 0 }}
               transition={{ duration: 2, ease: "linear", repeat: Infinity }}
             >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-24 bg-gradient-to-b from-transparent to-cyan-500/20" />
             </motion.div>
           )}
         </AnimatePresence>
         
         {/* Overlay Badges */}
         <div className="absolute top-4 left-4 z-30">
            <span className={`text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg backdrop-blur-md transition-all shadow-lg border ${step === 2 ? 'bg-cyan-500/80 text-white border-cyan-400' : 'bg-slate-900/80 text-slate-300 border-slate-700'}`}>
              {step === 2 ? '✨ 4K STUDIO RENDER' : '📷 RAW CAMERA'}
            </span>
         </div>

         {/* CTA Overlay when idle */}
         {step === 0 && (
           <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-[2px]">
             <span className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-full text-sm shadow-[0_0_20px_rgba(6,182,212,0.5)]">
               Klik untuk Generate
             </span>
           </div>
         )}
      </div>

      {/* Prompt Controls */}
      <div className="flex gap-3">
         <div className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-slate-400 font-mono flex items-center overflow-hidden shadow-inner">
            <span className="text-cyan-400 font-bold mr-2">&gt;</span>
            <span className="truncate text-slate-300">
               {step === 0 ? "Menunggu input prompt..." : step === 1 ? "Generating studio lighting..." : "Cinematic studio lighting, 4K, photorealistic"}
            </span>
            {step === 1 && <span className="w-1.5 h-4 bg-cyan-400 ml-1 animate-pulse" />}
         </div>
         <button 
           onClick={handleGenerateClick}
           disabled={step === 1}
           className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold px-5 py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] min-w-[120px]"
         >
           {step === 1 ? <Cpu className="w-4 h-4 animate-spin text-cyan-200" /> : <Sparkles className="w-4 h-4 text-cyan-200" />}
           {step === 1 ? 'Proses' : 'Generate'}
         </button>
      </div>
    </div>
  )
}

const Hero = () => {
  const heroFeatures = [
    {
      icon: ShieldCheck,
      title: "100% Brand Shield",
      desc: "Bentuk asli & logo terjaga",
      badge: "LOCKED",
      color: "from-blue-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-400"
    },
    {
      icon: ImageIcon,
      title: "4K Ultra HD",
      desc: "Kualitas studio komersial",
      badge: "HIGH-RES",
      color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-400"
    },
    {
      icon: Zap,
      title: "Lightning AI",
      desc: "Selesai dalam 30 detik",
      badge: "INSTANT",
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400"
    },
    {
      icon: Wand2,
      title: "Smart Prompt",
      desc: "AI merakit teks untuk Anda",
      badge: "ANTI BINGUNG",
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400"
    }
  ];

  return (
    <div className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-slate-950 text-white isolate">
      {/* High-tech Cyber Grid Background & Glow Effects */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Background Image Overlay */}
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=60&w=1080" 
          alt="Abstract Cyber Background" 
          className="w-full h-full object-cover opacity-15 scale-105"
          fetchPriority="high"
          loading="eager"
        />
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.15)_0%,transparent_60%)] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(6,182,212,0.15)_0%,transparent_60%)] rounded-full pointer-events-none" />
        
        {/* Cyber Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_80%,transparent_100%)] opacity-30" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Text & CTAs */}
          <StaggerContainer className="text-center lg:text-left">
            {/* Top Cyber Badge */}
            <StaggerItem>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs sm:text-sm font-semibold text-cyan-300 mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-md">
                <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Product Integrity Guarantee™</span>
              </div>
            </StaggerItem>
            
            {/* Main Headline */}
            <StaggerItem>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]">
                Foto Produk Profesional.<br />
                <span className="text-animated-authenticity drop-shadow-[0_0_25px_rgba(56,189,248,0.35)]">
                  Produk Tetap Asli.
                </span>
              </h1>
            </StaggerItem>
            
            {/* Subtitle */}
            <StaggerItem>
              <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed font-normal">
                Tingkatkan konversi penjualan e-commerce dengan kualitas studio. AI kami mempercantik foto tanpa mengubah bentuk, warna, atau logo asli produk Anda.
              </p>

              {/* Marketplace Visual Tags */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2.5 mb-10">
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider mr-1">Optimized For:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-950/60 border border-orange-500/40 text-orange-300 text-xs font-semibold">
                  <img src="https://cdn.simpleicons.org/shopee/EE4D2D" alt="Shopee" className="w-3.5 h-3.5 object-contain" />
                  Shopee
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-200 text-xs font-semibold">
                  <img src="https://cdn.simpleicons.org/tiktok/ffffff" alt="TikTok" className="w-3.5 h-3.5 object-contain" />
                  TikTok Shop
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hidden sm:inline-flex">
                  <img src="https://cdn.worldvectorlogo.com/logos/tokopedia.svg" alt="Tokopedia" className="w-3.5 h-3.5 object-contain" />
                  Tokopedia
                </span>
              </div>
            </StaggerItem>
            
            {/* CTA Buttons */}
            <StaggerItem>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4 mb-12">
                <SignedOut>
                  <SignInButton mode="modal" fallbackRedirectUrl="/studio" signUpFallbackRedirectUrl="/studio">
                    <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-2xl font-extrabold text-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 cursor-pointer">
                      <Sparkles className="w-5 h-5 text-cyan-200 fill-cyan-200" />
                      Mulai Gratis
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link to="/studio" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-2xl font-extrabold text-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 cursor-pointer">
                    <Sparkles className="w-5 h-5 text-cyan-200 fill-cyan-200" />
                    Masuk Studio
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </SignedIn>
                <span className="text-slate-400 font-mono text-sm hidden sm:block">⚡ 3 Kredit/Bulan</span>
              </div>
            </StaggerItem>

          </StaggerContainer>

          {/* Right Column: Interactive Demo */}
          <div className="w-full">
             <motion.div
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.2 }}
             >
                <HeroInteractiveDemo />
             </motion.div>
          </div>
        </div>
        
        {/* Bottom Banner & Features Grid */}
        <div className="mt-20">
          <StaggerContainer>
            {/* Live Visual Infographic Banner / Node Graphic */}
            <StaggerItem>
              <div className="p-4 mb-10 rounded-2xl bg-slate-900/60 border border-slate-800 max-w-5xl mx-auto backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="font-mono text-emerald-400 font-bold">LIVE AI PIPELINE:</span>
                  <span className="hidden sm:inline">Upload Foto Biasa ➔ AI Integrity Protection ➔ Ekspor Foto Studio 4K</span>
                </div>
                <div className="flex items-center flex-wrap justify-center gap-3 shrink-0 text-slate-400 font-mono">
                  <span className="flex items-center gap-1"><Check className="w-4 h-4 text-cyan-400" /> Form Locked</span>
                  <span className="flex items-center gap-1"><Check className="w-4 h-4 text-cyan-400" /> Color Locked</span>
                  <span className="flex items-center gap-1"><Check className="w-4 h-4 text-cyan-400" /> Logo Safe</span>
                </div>
              </div>
            </StaggerItem>

            {/* Infographic Feature Cards Grid */}
            <StaggerItem>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {heroFeatures.map((item, index) => {
                  const IconComp = item.icon;
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ y: -6, scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-cyan-500/40 text-left transition-all relative overflow-hidden group shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} border shrink-0`}>
                          <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors mb-1">
                        {item.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>

      </div>
    </div>
  );
};

export default Hero;

