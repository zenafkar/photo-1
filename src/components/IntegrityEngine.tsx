import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Lock, 
  Image as ImageIcon, 
  SunMedium, 
  Layers, 
  Box, 
  Palette, 
  ScanText, 
  Droplet, 
  Award, 
  Fingerprint, 
  Cpu, 
  ShieldAlert,
  Zap
} from 'lucide-react';
import { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

const IntegrityEngine = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  // Scroll progress for the entire section (for background parallax)
  const { scrollYProgress: sectionScrollY } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(sectionScrollY, [0, 1], ["-10%", "10%"]);
  const backgroundScale = useTransform(sectionScrollY, [0, 1], [1, 1.05]);

  // Scroll progress for the rings container (to animate rings when in view)
  const ringsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: ringsScrollY } = useScroll({
    target: ringsRef,
    offset: ["start end", "center center"]
  });

  const allowedItems = [
    {
      icon: ImageIcon,
      title: 'Background & Setting',
      desc: 'Studio, Cafe, Alam & Custom Scenes',
      tag: 'DYNAMIC AI',
      color: 'from-blue-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-400'
    },
    {
      icon: SunMedium,
      title: 'Pencahayaan & Shadow',
      desc: 'Lighting Dramatis & Raytraced Reflection',
      tag: 'ADAPTIVE',
      color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400'
    },
    {
      icon: Layers,
      title: 'Refleksi Meja / Lantai',
      desc: 'Physically Accurate Surface Physics',
      tag: 'PHYSICS AI',
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400'
    },
    {
      icon: Box,
      title: 'Properti Pendukung',
      desc: 'Bunga, Kayu, Daun & Aksesoris',
      tag: 'SMART PLACEMENT',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400'
    },
    {
      icon: Palette,
      title: 'Komposisi & Mood',
      desc: 'Color Grading & Atmosphere Harmony',
      tag: 'AESTHETIC',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400'
    }
  ];

  const restrictedItems = [
    {
      icon: ShieldAlert,
      title: 'Bentuk Asli Produk',
      desc: '100% Geometry & Mesh Locked',
      tag: '🔒 LOCKED',
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400'
    },
    {
      icon: Droplet,
      title: 'Warna Produk',
      desc: 'Delta-E Precise Color Spectrum',
      tag: '🔒 EXACT MATCH',
      color: 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400'
    },
    {
      icon: ScanText,
      title: 'Label & Tulisan',
      desc: 'OCR Vector Preserved & Sharp Text',
      tag: '🔒 PRESERVED',
      color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-400'
    },
    {
      icon: Award,
      title: 'Logo Brand',
      desc: 'Zero Logo Deformation / Artifacts',
      tag: '🔒 PROTECTED',
      color: 'from-amber-500/20 to-red-500/20 border-amber-500/30 text-amber-400'
    },
    {
      icon: Fingerprint,
      title: 'Motif & Tekstur Kemasan',
      desc: 'High-Res Surface Grain & Finish',
      tag: '🔒 UNTOUCHED',
      color: 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400'
    }
  ];

  return (
    <section ref={sectionRef} id="integrity" className="py-16 md:py-24 relative overflow-hidden bg-slate-950">
      {/* Background Image with Parallax & Overlay */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('/integrity-bg.jpg')",
            y: backgroundY,
            scale: backgroundScale,
          }}
        />
        {/* Dark cyber gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950 backdrop-blur-md" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header section with futuristic cyber pill */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-950/70 border border-blue-500/30 rounded-full mb-6 backdrop-blur-md shadow-lg shadow-blue-500/10"
          >
            <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-mono text-cyan-300">AI Product Integrity Engine v2.0</span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Product Integrity <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Engine™</span>
          </h2>
          <p className="text-base md:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Banyak AI generator yang mengubah produk asli Anda dan membuat pelanggan kecewa. 
            <strong className="text-cyan-300 font-semibold"> Prodify menjamin produk Anda tetap autentik 100%.</strong>
          </p>
        </div>

        {/* Infographic Dual Matrix Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Card 1: AI Boleh Mengubah */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative group bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-[0_0_40px_rgba(6,182,212,0.25)] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(6,182,212,0.15)_0%,transparent_70%)] group-hover:bg-[radial-gradient(circle,rgba(6,182,212,0.25)_0%,transparent_70%)] rounded-full transition-all pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-24 h-24 border border-cyan-500/20 rounded-full" />

            {/* Header Title */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    AI Boleh Mengubah
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  </h3>
                  <span className="text-xs font-mono text-cyan-400/80 uppercase tracking-wider">Dynamic Creative Enhancements</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono rounded-full hidden sm:inline-block">
                GEN-AI PERMITTED
              </span>
            </div>

            {/* Infographic Icon Items */}
            <div className="space-y-4">
              {allowedItems.map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02, x: 4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all group/item"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} border shrink-0`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100 group-hover/item:text-cyan-300 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 shrink-0 ml-2">
                      {item.tag}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Card 2: AI Dilarang Mengubah */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative group bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.15)] hover:shadow-[0_0_40px_rgba(244,63,94,0.25)] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(244,63,94,0.15)_0%,transparent_70%)] group-hover:bg-[radial-gradient(circle,rgba(244,63,94,0.25)_0%,transparent_70%)] rounded-full transition-all pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-24 h-24 border border-rose-500/20 rounded-full" />

            {/* Header Title */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-rose-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shadow-inner">
                  <Lock className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    AI Dilarang Mengubah
                    <XCircle className="w-5 h-5 text-rose-400" />
                  </h3>
                  <span className="text-xs font-mono text-rose-400/80 uppercase tracking-wider">Strict Preservation Matrix</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono rounded-full hidden sm:inline-block">
                HARDWARE LOCKED
              </span>
            </div>

            {/* Infographic Icon Items */}
            <div className="space-y-4">
              {restrictedItems.map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02, x: 4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-rose-500/40 transition-all group/item"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} border shrink-0`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100 group-hover/item:text-rose-300 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-500/30 text-rose-300 shrink-0 ml-2">
                      {item.tag}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Live Authenticity Score Infographic Validation Bar */}
        <div ref={ringsRef} className="mt-16 bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 max-w-6xl mx-auto border border-blue-500/20 shadow-[0_0_50px_rgba(30,58,138,0.3)] relative overflow-hidden">
          {/* Subtle Cyber Grid Accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-slate-800 pb-6 relative z-10">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-white">Live Authenticity Score Validation</h4>
                <p className="text-xs text-slate-400">Computer Vision Pixel Match & OCR Integrity Radar</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              SYSTEM ACTIVE: 100% ACCURATE
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
            <ScoreRing label="Shape Mesh Match" value={99.8} scrollYProgress={ringsScrollY} color="#38BDF8" />
            <ScoreRing label="Delta-E Color Match" value={99.5} scrollYProgress={ringsScrollY} color="#818CF8" />
            <ScoreRing label="Logo Vector Lock" value={100} scrollYProgress={ringsScrollY} color="#34D399" />
            <ScoreRing label="OCR Label Clarity" value={99.9} scrollYProgress={ringsScrollY} color="#F472B6" />
          </div>
        </div>
      </div>
    </section>
  );
};

const ScoreRing = ({ label, value, scrollYProgress, color = "#60A5FA" }: { label: string, value: number, scrollYProgress: MotionValue<number>, color?: string }) => {
  const circumference = 282.743; // 2 * Math.PI * 45
  const targetOffset = circumference * (1 - value / 100);
  
  // Map scroll progress (0 to 1) to stroke dash offset (empty to filled)
  const strokeDashoffset = useTransform(scrollYProgress, [0, 1], [circumference, targetOffset]);

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all">
      <div className="relative w-24 h-24 mb-3">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <motion.circle 
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke={color} 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={circumference} 
            style={{ strokeDashoffset }} 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white tracking-tight">{value}%</span>
          <span className="text-[9px] font-mono text-slate-400">PASSED</span>
        </div>
      </div>
      <span className="text-slate-300 font-medium text-xs text-center">{label}</span>
    </div>
  );
};

export default IntegrityEngine;

