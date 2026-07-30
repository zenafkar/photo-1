import { Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const InteractiveSandbox = () => {
  const styles = [
    { id: 'marble', name: 'Marble Studio', thumb: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=200', bg: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200' },
    { id: 'nature', name: 'Nature Vibes', thumb: 'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&q=80&w=200', bg: 'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&q=80&w=1200' },
    { id: 'abstract', name: 'Modern Abstract', thumb: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&q=80&w=200', bg: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&q=80&w=1200' },
    { id: 'wood', name: 'Rustic Wood', thumb: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=200', bg: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=1200' }
  ];

  const [activeBg, setActiveBg] = useState(styles[0]);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
  // Animation State
  const revealProgress = useMotionValue(0); // 0 to 100
  const [isHovered, setIsHovered] = useState(false);

  // Constants for assets
  const beforeBgUrl = 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=1200'; // Simple grey background simulating a raw photo table
  const productAsset = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800'; // Real product

  useEffect(() => {
    if (isHovered) return;

    // Cinematic 6-second loop: Pause Before (0%) -> Transition -> Pause After (100%) -> Transition back
    const controls = animate(revealProgress, [0, 0, 100, 100, 0, 0], {
      duration: 7,
      times: [0, 0.15, 0.45, 0.65, 0.95, 1],
      repeat: Infinity,
      ease: "easeInOut"
    });

    return () => controls.stop();
  }, [isHovered, revealProgress, activeBg]); // re-run if activeBg changes to restart loop smoothly

  const handleStyleClick = (newStyle: typeof styles[0]) => {
    if (newStyle.id === activeBg.id) return;
    setActiveBg(newStyle);
    // When changing style, smoothly animate to the 'after' state to show it off
    setIsHovered(true);
    animate(revealProgress, 100, { duration: 0.8, ease: "easeOut" }).then(() => {
      setTimeout(() => setIsHovered(false), 500); // release interaction hold after a short delay
    });
  };

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Interaction handlers for manual drag/explore
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isHovered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    revealProgress.set(percentage);
  };

  const handlePointerEnter = () => setIsHovered(true);
  const handlePointerLeave = () => setIsHovered(false);

  // Derived values for styling based on reveal progress
  const clipPathValue = useTransform(revealProgress, (val) => `inset(0 ${100 - val}% 0 0)`);
  const lineLeftValue = useTransform(revealProgress, (val) => `${val}%`);
  const beforeLabelOpacity = useTransform(revealProgress, [0, 30], [1, 0]);
  const afterLabelOpacity = useTransform(revealProgress, [70, 100], [0, 1]);

  return (
    <section className="py-24 bg-[#F8F9FA] relative overflow-hidden" id="fitur">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm border border-gray-100 mb-6">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 tracking-tight mb-4 max-w-3xl leading-tight text-balance">
            Create professional product photos with AI
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl font-medium text-pretty">
            Transform plain images into studio-quality visuals that capture attention, build trust, and drive sales.
          </p>
        </div>

        {/* Interactive App UI */}
        <div className="bg-white rounded-[32px] p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 max-w-5xl mx-auto flex flex-col md:flex-row gap-6 lg:gap-8">
          
          {/* Left Preview Box - Cinematic Reveal */}
          <div 
            className="w-full md:w-3/5 aspect-square md:aspect-[4/3] rounded-[24px] overflow-hidden relative bg-white shadow-inner isolate border border-gray-100 cursor-ew-resize select-none touch-none"
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerEnter}
            onPointerUp={handlePointerLeave}
            onPointerCancel={handlePointerLeave}
            onPointerMove={handlePointerMove}
          >
            {/* Layer 1: Before Background */}
            <div 
              className="absolute inset-0 bg-cover bg-center z-0" 
              style={{ backgroundImage: `url(${beforeBgUrl})`, filter: 'brightness(1.05)' }} 
            />
            
            {/* Layer 2: After Background (Revealed via CSS clip-path) */}
            <motion.div 
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ 
                backgroundImage: `url(${activeBg.bg})`,
                clipPath: clipPathValue,
                // Subtle zoom out effect linked to the reveal to add cinematic depth
                scale: useTransform(revealProgress, [0, 100], [1.05, 1]),
              }}
            />
            
            {/* Layer 3: Product & Shadows (Persistent) */}
            {/* Using mix-blend-multiply to blend the product's natural shadow dynamically with both backgrounds */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none mix-blend-multiply">
              <img 
                src={productAsset} 
                className="max-h-[85%] object-contain" 
                alt="Original Product" 
                draggable="false"
              />
            </div>
            
            {/* Layer 4: Transition Scanner Line */}
            <motion.div 
              className="absolute top-0 bottom-0 w-[2px] bg-white/90 shadow-[0_0_20px_4px_rgba(255,255,255,0.7)] z-20 pointer-events-none"
              style={{ left: lineLeftValue }}
            >
              {/* Drag Handle Knob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 bg-white/95 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center border border-gray-100">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3"/></svg>
              </div>
            </motion.div>
            
            {/* Layer 5: UI Overlays */}
            <motion.div 
              className="absolute top-4 left-4 z-30 pointer-events-none"
              style={{ opacity: beforeLabelOpacity }}
            >
              <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold rounded-full shadow-sm tracking-[0.2em]">
                BEFORE
              </div>
            </motion.div>

            <motion.div 
              className="absolute top-4 right-4 z-30 pointer-events-none"
              style={{ opacity: afterLabelOpacity }}
            >
              <div className="px-3 py-1.5 bg-indigo-600/90 backdrop-blur-md text-white text-[11px] font-bold rounded-full shadow-sm tracking-[0.2em] shadow-indigo-600/20">
                AFTER
              </div>
            </motion.div>

            <motion.div 
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-opacity duration-300"
              style={{ opacity: isHovered ? 0 : 1 }}
            >
              <div className="px-4 py-2 bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-extrabold rounded-full shadow-xl tracking-[0.2em] border border-gray-100 uppercase animate-pulse">
                Drag To Explore
              </div>
            </motion.div>
            
          </div>

          {/* Right Controls Box */}
          <div className="w-full md:w-2/5 flex flex-col pt-2">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Pilih Background</h3>
            <p className="text-sm text-slate-500 mb-6">Pilih template dan lihat bagaimana AI mempertahankan keaslian produk Anda dengan sempurna.</p>
            
            <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6">
              {styles.map(style => (
                <button 
                  key={style.id}
                  onClick={() => handleStyleClick(style)}
                  className={`relative aspect-square rounded-[20px] overflow-hidden border-2 transition-all ${
                    activeBg.id === style.id 
                      ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-md transform scale-[1.02]' 
                      : 'border-transparent hover:border-indigo-200 hover:shadow-sm'
                  } cursor-pointer`}
                >
                  <img src={style.thumb} alt={style.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 text-left">
                    <span className="text-white text-sm font-semibold tracking-wide">{style.name}</span>
                  </div>
                  
                  {/* Active Indicator Check */}
                  {activeBg.id === style.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleDownload}
              className={`mt-auto w-full py-4 rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2 group ${
                downloadSuccess ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg'
              }`}
            >
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {downloadSuccess ? 'Menyiapkan Download 4K...' : 'Download High-Res 4K'}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveSandbox;
