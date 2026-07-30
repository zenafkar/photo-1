import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Sparkles, Crown, Sun, Palette, Box } from 'lucide-react';

const InteractiveSandbox = () => {
  const styles = [
    { 
      id: 'professional', 
      name: 'Professional', 
      prompt: 'Parfum Mystiq, foto di atas keyboard laptop, — mau jadi elegan dengan background batu alam, kain sutra, dan pencahayaan dramatis.',
      icon: <Crown className="w-4 h-4" />,
      afterImage: '/mystic-after.jpg' 
    }
  ];

  // Raw product snapshot (Before AI)
  const beforeImage = '/mystic-before.jpg';

  const [activeStyle, setActiveStyle] = useState(styles[0]);
  
  // Animation State
  const revealProgress = useMotionValue(50); // initial 50% split
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    // Cinematic loop animation: 10% -> 90% -> 10%
    const controls = animate(revealProgress, [10, 90, 90, 10, 10], {
      duration: 8,
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

  return (
    <section className="bg-[rgba(240,240,240,0.3)] py-20 md:py-24 border-t border-neutral-100/80" id="fitur">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          
          {/* Left Side Content */}
          <div>
            <h2 className="text-[28px] sm:text-[36px] md:text-[48px] font-extrabold tracking-tight mb-6 text-[#0A0A0A] leading-[1.1]">
              Masuk dengan kualitas biasa,<br />keluar dengan kualitas studio.
            </h2>
            <p className="text-[#888888] text-base md:text-lg mb-8 leading-relaxed">
              Geser untuk bandingkan: foto produk dari HP vs hasil setelah AI — pencahayaan studio, background rapi, tetap natural tanpa mengubah bentuk asli.
            </p>
            
            <div className="mb-10">
              <p className="text-sm font-semibold text-[#0A0A0A] mb-3">Pilih Style Studio:</p>
              <div className="flex flex-wrap gap-2.5">
                {styles.map(style => {
                  const isActive = activeStyle.id === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => handleStyleClick(style)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#0A0A0A] text-white shadow-md'
                          : 'bg-white border border-neutral-200 text-[#0A0A0A] hover:bg-neutral-50 hover:border-neutral-300'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-neutral-500'}>
                        {style.icon}
                      </span>
                      {style.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <a 
                href="#pricing"
                className="bg-[#0A0A0A] text-white px-8 py-3.5 rounded-full font-medium hover:bg-neutral-800 transition-colors w-full sm:w-auto text-center shadow-lg shadow-black/5"
              >
                Coba Sekarang
              </a>
              <span className="text-sm text-[#888888]">Gratis 10 foto/bulan</span>
            </div>
          </div>

          {/* Right Side Card (Before/After Slider) */}
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-neutral-200">
            <div className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">
              Contoh produk
            </div>
            
            <div className="bg-[#F9F9F9] rounded-xl p-4 border border-neutral-200 mb-5 font-medium text-[#0A0A0A] text-sm md:text-base italic">
              "{activeStyle.prompt}"
            </div>
            
            <div 
              className="aspect-square rounded-2xl overflow-hidden relative bg-slate-900 isolate border border-neutral-200 cursor-ew-resize select-none touch-none shadow-inner"
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
              onPointerDown={handlePointerEnter}
              onPointerUp={handlePointerLeave}
              onPointerCancel={handlePointerLeave}
              onPointerMove={handlePointerMove}
            >
              {/* Layer 1: BEFORE Image */}
              <img 
                src={beforeImage} 
                alt="Foto Mentah Asli" 
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
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
              
              {/* Layer 3: Transition Line */}
              <motion.div 
                className="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_15px_rgba(0,0,0,0.4)] z-20 pointer-events-none"
                style={{ left: lineLeftValue }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-12 bg-white rounded-full shadow-xl flex items-center justify-center border border-gray-200">
                  <svg className="w-5 h-5 text-[#0A0A0A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3"/>
                  </svg>
                </div>
              </motion.div>
              
              {/* Layer 4: Badges */}
              <div className="absolute top-4 left-4 z-30 pointer-events-none">
                <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold rounded-lg shadow-md tracking-wider flex items-center gap-1.5 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  BEFORE
                </div>
              </div>

              <div className="absolute top-4 right-4 z-30 pointer-events-none">
                <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold rounded-lg shadow-md tracking-wider flex items-center gap-1.5 border border-white/10">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  AFTER
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveSandbox;
