import { 
  ArrowRight, 
  Image as ImageIcon, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  TrendingUp, 
  Check
} from 'lucide-react';
import { StaggerContainer, StaggerItem } from './ScrollReveal';
import { SignInButton, SignedOut, SignedIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Hero = () => {
  const heroFeatures = [
    {
      icon: ShieldCheck,
      title: "100% Brand Shield",
      desc: "Tidak mengubah logo, text, & bentuk asli",
      badge: "LOCKED",
      color: "from-blue-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-400"
    },
    {
      icon: ImageIcon,
      title: "4K Ultra HD Output",
      desc: "Kualitas studio komersial tingkat tinggi",
      badge: "4K HIGH-RES",
      color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-400"
    },
    {
      icon: Zap,
      title: "Lightning AI Generation",
      desc: "Foto siap publish dalam 30 detik",
      badge: "INSTANT 30s",
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400"
    },
    {
      icon: TrendingUp,
      title: "High-Conversion Ready",
      desc: "Dioptimalkan khusus algoritma e-commerce",
      badge: "BOOST SALES",
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400"
    }
  ];

  return (
    <div className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-slate-950 text-white isolate">
      {/* High-tech Cyber Grid Background & Glow Effects */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Background Image Overlay (Dioptimalkan untuk LCP Mobile) */}
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=60&w=1080" 
          alt="Abstract Cyber Background" 
          className="w-full h-full object-cover opacity-15 scale-105"
          fetchPriority="high"
          loading="eager"
        />
        {/* Glowing Orbs - Menggunakan radial-gradient untuk performa Safari iOS (anti-lag) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(79,70,229,0.15)_0%,transparent_60%)] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_60%)] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(147,51,234,0.1)_0%,transparent_60%)] rounded-full pointer-events-none" />
        
        {/* Cyber Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-30" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <StaggerContainer>
          {/* Top Cyber Badge */}
          <StaggerItem>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs sm:text-sm font-semibold text-cyan-300 mb-8 shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-md">
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Product Integrity Guarantee™ — AI Autentikasi Produk 100%</span>
            </div>
          </StaggerItem>
          
          {/* Main Headline */}
          <StaggerItem>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
              Foto Produk Profesional.<br />
              <span className="text-animated-authenticity drop-shadow-[0_0_25px_rgba(56,189,248,0.35)]">
                Produk Tetap Asli.
              </span>
            </h1>
          </StaggerItem>
          
          {/* Subtitle with Marketplace Visual Tags */}
          <StaggerItem>
            <p className="mt-4 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed font-normal">
              Tingkatkan konversi penjualan e-commerce dengan kualitas studio. AI kami mempercantik foto tanpa mengubah bentuk, warna, atau logo asli produk Anda.
            </p>

            {/* Marketplace Visual Tags */}
            <div className="flex flex-wrap justify-center items-center gap-2.5 mb-10">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider mr-1">Optimized For:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-950/60 border border-orange-500/40 text-orange-300 text-xs font-semibold shadow-[0_0_10px_rgba(238,77,45,0.2)]">
                <img src="https://cdn.simpleicons.org/shopee/EE4D2D" alt="Shopee" className="w-3.5 h-3.5 object-contain" />
                Shopee
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-200 text-xs font-semibold shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                <img src="https://cdn.simpleicons.org/tiktok/ffffff" alt="TikTok" className="w-3.5 h-3.5 object-contain" />
                TikTok Shop
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-950/60 border border-pink-500/40 text-pink-300 text-xs font-semibold shadow-[0_0_10px_rgba(228,64,95,0.2)]">
                <img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" className="w-3.5 h-3.5 object-contain" />
                Instagram
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-[0_0_10px_rgba(0,170,91,0.2)]">
                <img src="https://cdn.worldvectorlogo.com/logos/tokopedia.svg" alt="Tokopedia" className="w-3.5 h-3.5 object-contain" />
                Tokopedia
              </span>
            </div>
          </StaggerItem>
          
          {/* CTA Buttons */}
          <StaggerItem>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-2xl font-extrabold text-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 cursor-pointer">
                    <Sparkles className="w-5 h-5 text-cyan-200 fill-cyan-200" />
                    Mulai Gratis (3 Foto/Bulan)
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/studio" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-2xl font-extrabold text-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 cursor-pointer">
                  <Sparkles className="w-5 h-5 text-cyan-200 fill-cyan-200" />
                  Masuk ZenStudio Studio
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </SignedIn>
            </div>
          </StaggerItem>

          {/* Infographic Feature Cards Grid */}
          <StaggerItem>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-12">
              {heroFeatures.map((item, index) => {
                const IconComp = item.icon;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-cyan-500/40 text-left transition-all relative overflow-hidden group shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} border shrink-0`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </StaggerItem>

          {/* Live Visual Infographic Banner / Node Graphic */}
          <StaggerItem>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 max-w-4xl mx-auto backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="font-mono text-emerald-400 font-bold">LIVE AI PIPELINE:</span>
                <span>Upload Foto Biasa ➔ AI Integrity Protection ➔ Ekspor Foto Studio 4K</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-slate-400 font-mono">
                <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-cyan-400" /> Form Locked</span>
                <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-cyan-400" /> Color Locked</span>
                <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-cyan-400" /> Logo Safe</span>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </div>
  );
};

export default Hero;

