import { Award, ShieldAlert, Droplet, Image as ImageIcon, Cpu, Crosshair, Hexagon } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const features = [
    {
      id: 'bg',
      label: 'SCENE GEN',
      title: 'Latar Bebas Diubah',
      desc: 'Area di luar produk bebas Anda kreasikan. Ganti dari meja kafe ke atas awan dalam 5 detik.',
      icon: ImageIcon,
      accent: 'text-landing-text',
      border: 'border-landing-text',
      bg: 'bg-landing-text/10'
    },
    {
      id: 'logo',
      label: 'OCR LOCK',
      title: 'Keutuhan Logo',
      desc: 'Tidak ada lagi logo aneh atau teks alien. Mesin OCR mengunci merek Anda agar tetap tajam.',
      icon: Award,
      accent: 'text-landing-secondary',
      border: 'border-landing-secondary',
      bg: 'bg-landing-secondary/10'
    },
    {
      id: 'shape',
      label: 'GEOMETRY',
      title: 'Bentuk Absolut',
      desc: 'Botol tidak melengkung. Siluet asli produk dikunci presisi hingga level piksel terdalam.',
      icon: ShieldAlert,
      accent: 'text-landing-primary',
      border: 'border-landing-primary',
      bg: 'bg-landing-primary/10'
    },
    {
      id: 'color',
      label: 'DELTA-E MATCH',
      title: 'Akurasi Warna',
      desc: 'Merah ya merah, bukan oranye. Jaminan warna asli tanpa distorsi grading AI.',
      icon: Droplet,
      accent: 'text-amber-400',
      border: 'border-amber-400',
      bg: 'bg-amber-400/10'
    }
  ];

  return (
    <section data-component="integrity" ref={sectionRef} id="integrity" className="py-24 lg:py-32 relative overflow-hidden bg-landing-bg border-t border-landing-border text-landing-text">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-landing-surface/50 border border-landing-border mb-6"
          >
            <Cpu className="w-3.5 h-3.5 text-landing-secondary animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-mono text-landing-text-muted">Pixel Protection Tech</span>
          </motion.div>

          <h2 className="font-landing-display text-4xl md:text-5xl lg:text-6xl font-light text-landing-text mb-6 tracking-tight">
            Ubah Latar Bebas.{" "}
            <br className="hidden sm:block" />
            <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-landing-primary to-landing-secondary">
              Jangan Sentuh Produk Saya.
            </span>
          </h2>
          <p className="text-lg text-landing-text-muted max-w-3xl mx-auto font-light leading-relaxed">
            Sering kesal AI merusak bentuk botol atau melengkungkan logo?{" "}
            <strong className="text-landing-text font-normal">ZenStudio mengunci bentuk, warna, dan tulisan asli produk Anda 100%.</strong>
          </p>
        </div>

        {/* The Light Table HUD */}
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-landing-surface/30 border border-landing-border p-1">
            {/* Top Bar HUD */}
            <div className="h-10 border-b border-landing-border flex items-center justify-between px-4 bg-landing-surface/80">
              <div className="flex items-center gap-4">
                <Crosshair className="w-4 h-4 text-landing-text-muted" />
                <span className="text-[10px] font-mono tracking-widest text-landing-text-muted">ZEN-ENGINE v2.4</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-landing-secondary animate-pulse" />
                <span className="text-[10px] font-mono text-landing-secondary">SYSTEM ONLINE</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Left Control Panel */}
              <div className="w-full md:w-[280px] border-b md:border-b-0 md:border-r border-landing-border bg-landing-surface/40 p-4 md:p-6 flex flex-row md:flex-col gap-2 md:gap-4 overflow-x-auto snap-x scrollbar-none">
                <div className="hidden md:block text-[10px] font-mono text-landing-text-muted mb-2 tracking-widest">ISOLATION PARAMETERS</div>
                {features.map((f) => {
                  const isActive = activeFeature === f.id;
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      onClick={() => { setActiveFeature(f.id); setIsAutoPlaying(false); }}
                      className={`snap-start shrink-0 w-[200px] md:w-full text-left p-4 border transition-all duration-300 relative overflow-hidden group
                        ${isActive ? `${f.bg} ${f.border}` : 'bg-landing-bg border-landing-border hover:border-landing-text-muted/50'}`}
                    >
                      {isActive && <div className={`absolute top-0 left-0 bottom-0 w-1 ${f.bg.replace('/10', '')}`} />}
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-4 h-4 ${isActive ? f.accent : 'text-landing-text-muted group-hover:text-landing-text'}`} />
                        <span className={`text-[10px] font-mono tracking-widest ${isActive ? f.accent : 'text-landing-text-muted group-hover:text-landing-text'}`}>
                          {f.label}
                        </span>
                      </div>
                      <div className={`text-sm font-medium mb-1 ${isActive ? 'text-landing-text' : 'text-landing-text-muted'}`}>{f.title}</div>
                      {isActive && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-xs font-light text-landing-text-muted mt-2">
                          {f.desc}
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Main Canvas Viewer */}
              <div className="flex-1 relative aspect-[4/5] sm:aspect-square md:aspect-auto md:min-h-[600px] bg-[#0A0A0C] overflow-hidden flex items-center justify-center p-4 sm:p-8">
                {/* Calibration Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
                
                {/* Center Reticle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-landing-border/50 rounded-full pointer-events-none flex items-center justify-center">
                  <div className="w-[150px] h-[150px] border border-dashed border-landing-border/30 rounded-full" />
                </div>

                {/* The Image Container */}
                <div className="relative w-full max-w-[320px] aspect-[3/4] z-10 border border-landing-border shadow-2xl">
                  {/* Base AI Output */}
                  <img src="/hotin-after.jpg" alt="Output" className="absolute inset-0 w-full h-full object-cover" />
                  
                  {/* Original Image Mask (Fades in/out) */}
                  <img 
                    src="/hotin-before.jpg" 
                    alt="Original" 
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${activeFeature === 'bg' ? 'opacity-100' : 'opacity-0'}`} 
                  />

                  {/* Overlays */}
                  <AnimatePresence>
                    {activeFeature === 'shape' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="absolute z-30 pointer-events-none border-2 border-landing-primary bg-landing-primary/10 shadow-[0_0_30px_rgba(212,69,42,0.4)]"
                        style={{ top: '5%', bottom: '28%', left: '25%', right: '25%' }}
                      >
                        {/* Anchor points */}
                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-landing-bg border border-landing-primary" />
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-landing-bg border border-landing-primary" />
                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-landing-bg border border-landing-primary" />
                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-landing-bg border border-landing-primary" />
                      </motion.div>
                    )}

                    {activeFeature === 'color' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute z-30 pointer-events-none mix-blend-overlay bg-amber-400/40 border border-amber-400"
                        style={{ top: '18%', bottom: '38%', left: '30%', right: '30%' }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-mono text-amber-950 bg-amber-400 px-1">#D42A2A</div>
                      </motion.div>
                    )}

                    {activeFeature === 'logo' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute z-30 pointer-events-none border border-landing-secondary bg-landing-secondary/20 backdrop-blur-[2px] flex items-start justify-center"
                        style={{ top: '22%', bottom: '40%', left: '35%', right: '38%' }}
                      >
                        <div className="mt-[-20px] bg-landing-secondary text-landing-bg text-[9px] font-mono font-bold px-2 py-0.5 whitespace-nowrap shadow-[0_0_10px_rgba(61,139,125,0.8)]">
                          OCR.MATCH_100
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Laser Scanner Line */}
                  <motion.div
                    className="absolute top-0 left-[-10%] right-[-10%] h-[1px] bg-landing-text shadow-[0_0_20px_#FFFFFF] z-40 pointer-events-none"
                    animate={{ y: ['0px', '420px', '0px'] }}
                    transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                    style={{ opacity: activeFeature === 'bg' ? 0.8 : 0.2 }}
                  />
                </div>

                {/* Bottom Overlay Data (Desktop) */}
                <div className="hidden md:flex absolute bottom-4 left-4 right-4 justify-between items-end pointer-events-none">
                  <div className="bg-landing-surface/80 border border-landing-border p-3 backdrop-blur-md">
                    <div className="text-[9px] text-landing-text-muted font-mono mb-1">ANALYSIS LOG</div>
                    <div className="text-[10px] font-mono text-landing-text">
                      {activeFeature === 'bg' && '> Initiating background synthesis... OK'}
                      {activeFeature === 'shape' && '> Mask geometry verified against RAW... OK'}
                      {activeFeature === 'color' && '> Delta-E color profiling... MATCH'}
                      {activeFeature === 'logo' && '> Text boundary preserved... 100%'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Hexagon className="w-8 h-8 text-landing-border/50 animate-spin-slow" />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default IntegrityEngine;
