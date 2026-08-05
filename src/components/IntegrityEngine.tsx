import {
  Award,
  ShieldAlert,
  Droplet,
  Image as ImageIcon,
  Cpu,
  MousePointer2
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const IntegrityEngine = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>('bg');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveFeature(prev => {
        if (prev === null) return 'bg';
        const featureIds = ['bg', 'logo', 'shape', 'color'];
        const currentIndex = featureIds.indexOf(prev);
        const nextIndex = (currentIndex + 1) % featureIds.length;
        return featureIds[nextIndex];
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);


  const features = [
    {
      id: 'bg',
      title: 'Latar Bebas Diubah',
      desc: 'Area di luar produk bebas Anda kreasikan. Ganti dari meja kafe ke atas awan dalam 5 detik tanpa merusak produk.',
      icon: ImageIcon,
      color: 'from-secondary/20 to-teal-500/20 border-secondary/30 text-secondary',
      activeColor: 'border-secondary bg-secondary/10'
    },
    {
      id: 'logo',
      title: 'Keutuhan Logo',
      desc: 'Tidak ada lagi logo aneh atau teks alien. Mesin OCR kami membaca dan mengunci merek Anda agar tetap tajam.',
      icon: Award,
      color: 'from-amber-500/20 to-primary/20 border-amber-500/30 text-amber-400',
      activeColor: 'border-amber-400 bg-amber-400/10'
    },
    {
      id: 'shape',
      title: 'Bentuk Absolut',
      desc: 'Botol tidak akan tiba-tiba melengkung. Siluet asli produk Anda dikunci secara presisi hingga level piksel terdalam.',
      icon: ShieldAlert,
      color: 'from-sky-500/20 to-cyan-500/20 border-sky-500/30 text-sky-400',
      activeColor: 'border-sky-400 bg-sky-400/10'
    },
    {
      id: 'color',
      title: 'Akurasi Warna Sejati',
      desc: 'Merah ya merah, bukan oranye. Pelanggan tidak akan komplain karena barang datang beda warna dengan di foto.',
      icon: Droplet,
      color: 'from-primary/20 to-rose-500/20 border-primary/30 text-primary',
      activeColor: 'border-primary bg-primary/10'
    }
  ];

  return (
    <section data-component="integrity" ref={sectionRef} id="integrity" className="py-16 md:py-24 relative overflow-hidden bg-background border-t border-surface-border text-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-surface-border rounded-full mb-6"
          >
            <Cpu className="w-4 h-4 text-secondary animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-mono text-secondary">Pixel Protection Tech</span>
          </motion.div>

          <h2 className="font-display text-3xl md:text-5xl font-bold text-text mb-6 tracking-tight">
            Ubah Latar Bebas.{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
              Tapi Jangan Sentuh Produk Saya.
            </span>
          </h2>
          <p className="text-base md:text-xl text-text-muted max-w-3xl mx-auto font-normal leading-relaxed">
            Sering kesal karena AI merusak bentuk botol atau melengkungkan logo? Kami mengerti.{" "}
            <strong className="text-primary font-semibold">ZenStudio melindungi bentuk, warna, dan tulisan asli produk Anda 100%.</strong>
          </p>
        </div>

        {/* Interactive Scanner ("Show, Don't Tell") */}
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 items-center mb-24">

          {/* Left Side: Interactive Feature Cards */}
          <div className="flex-1 w-full space-y-4">
            <div className="mb-6 lg:mb-8 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-surface-border rounded-full text-xs font-mono text-text-muted mb-4">
                <MousePointer2 className="w-3.5 h-3.5 text-primary" /> Auto-Pilot Aktif (Sentuh/Hover untuk Jeda)
              </span>
              <h3 className="font-display text-2xl font-bold text-text mb-2">Anatomi Proteksi AI</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {features.map((f) => {
                const Icon = f.icon;
                const isActive = activeFeature === f.id;
                return (
                  <div
                    key={f.id}
                    onMouseEnter={() => { setActiveFeature(f.id); setIsAutoPlaying(false); }}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                    onTouchStart={() => { setActiveFeature(f.id); setIsAutoPlaying(false); }}
                    onTouchEnd={() => setIsAutoPlaying(true)}
                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-crosshair flex items-start gap-4
                      ${isActive ? f.activeColor : 'bg-surface/40 border-surface-border hover:border-primary/30'}`}
                  >
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${f.color} border shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={`font-sans font-bold mb-1.5 transition-colors ${isActive ? 'text-primary' : 'text-text'}`}>
                        {f.title}
                      </h4>
                      <p className={`text-sm leading-relaxed transition-colors ${isActive ? 'text-text-muted/90' : 'text-text-muted'}`}>
                        {f.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Visual Scanner Simulator */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none mx-auto relative">
            <div className="relative aspect-[4/5] sm:aspect-square md:aspect-video lg:aspect-square bg-surface/40 border border-surface-border rounded-[2.5rem] overflow-hidden flex items-center justify-center p-8 group">
              {/* Subtle Background Patterns */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,69,42,0.06)_0%,transparent_70%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-50" />

              {/* Real Product Image Visualizer */}
              <div className="relative w-full max-w-[280px] aspect-[3/4] mx-auto z-10 transition-all duration-500 rounded-3xl overflow-hidden shadow-2xl border border-surface-border">
                {/* Images */}
                <img
                  src="/hotin-after.jpg"
                  alt="Product After"
                  width={280}
                  height={373}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 z-10 hover:scale-105"
                />
                <img
                  src="/hotin-before.jpg"
                  alt="Product Before"
                  width={280}
                  height={373}
                  loading="lazy"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 z-20 ${activeFeature === 'bg' ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* Overlays for Highlights */}
                {/* 1. Shape/Geometry Highlight — tight bounding box around the tube only */}
                <div
                  className={`absolute rounded-[1.2rem] border-2 transition-all duration-500 z-30 pointer-events-none ${
                    activeFeature === 'shape' ? 'border-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.4)] bg-sky-400/10' : 'border-transparent'
                  }`}
                  style={{ top: '5%', bottom: '28%', left: '25%', right: '25%' }}
                >
                  {activeFeature === 'shape' && (
                    <>
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-sky-400 rounded-tl-md" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-sky-400 rounded-tr-md" />
                      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-sky-400 rounded-bl-md" />
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-sky-400 rounded-br-md" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-sky-400 rounded-full animate-ping" />
                    </>
                  )}
                </div>

                {/* 2. Color Match Highlight — only the red body of the tube */}
                <div
                  className={`absolute rounded-lg transition-all duration-500 z-30 pointer-events-none ${
                    activeFeature === 'color' ? 'bg-primary/30 mix-blend-overlay border border-primary shadow-[0_0_25px_rgba(212,69,42,0.4)]' : 'border-transparent'
                  }`}
                  style={{ top: '18%', bottom: '38%', left: '30%', right: '30%' }}
                />

                {/* 3. Logo/OCR Highlight — vertical strip over the brand text */}
                <div
                  className={`absolute rounded-lg border-2 border-dashed transition-all duration-500 z-30 pointer-events-none flex items-center justify-center ${
                    activeFeature === 'logo' ? 'border-amber-400 bg-amber-400/15 backdrop-blur-[1px]' : 'border-transparent'
                  }`}
                  style={{ top: '22%', bottom: '40%', left: '35%', right: '38%' }}
                >
                  {activeFeature === 'logo' && (
                    <span className="bg-amber-400 text-amber-950 text-[8px] font-black px-2 py-0.5 rounded-full absolute -top-3">OCR LOCKED</span>
                  )}
                </div>

                {/* Ambient Scanning Line */}
                <motion.div
                  className="absolute top-0 left-[-10%] right-[-10%] h-[2px] bg-primary shadow-[0_0_15px_rgba(212,69,42,0.8)] z-40 pointer-events-none"
                  animate={{ y: ['0px', '380px', '0px'] }}
                  transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                  style={{ opacity: activeFeature === null ? 0.7 : 0, willChange: 'transform' }}
                />
              </div>

              {/* Status Overlay UI */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row justify-between items-center px-5 py-3 bg-surface/60 backdrop-blur-sm border border-surface-border rounded-2xl gap-2 z-50">
                <span className="text-xs font-semibold text-text-muted tracking-wider">STATUS:</span>
                <span className="text-xs font-bold text-primary flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                  {activeFeature === 'logo' && 'OCR LOCK ENGAGED'}
                  {activeFeature === 'shape' && 'GEOMETRY PRESERVED'}
                  {activeFeature === 'color' && 'DELTA-E MATCHED'}
                  {activeFeature === 'bg' && 'SCENE GENERATION'}
                  {activeFeature === null && 'AWAITING INPUT'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default IntegrityEngine;
