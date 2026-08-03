import { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

const BeforeAfterSlider = ({ beforeImage, afterImage }: BeforeAfterSliderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Motion value for slider position (from 0 to 100 percent)
  // useMotionValue allows extremely performant updates at 60fps without triggering React re-renders!
  const position = useMotionValue(50);
  
  // Auto-slide animation
  useEffect(() => {
    if (isDragging) return;

    let controls: ReturnType<typeof animate>;
    
    // Start auto-slide after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      controls = animate(position, [position.get(), 75, 25, 50], {
        duration: 10,
        ease: "easeInOut",
        repeat: Infinity,
      });
    }, 2000);

    return () => {
      clearTimeout(timeout);
      if (controls) controls.stop();
    };
  }, [isDragging, position]);

  // We use CSS clip-path to mask the after image layer based on the slider position
  const clipPath = useTransform(position, (p) => `inset(0 ${100 - p}% 0 0)`);
  const leftPos = useTransform(position, (p) => `${p}%`);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    position.set(percent);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };

    const onUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    }
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[4/5] md:aspect-square max-w-2xl mx-auto rounded-[2rem] overflow-hidden cursor-ew-resize select-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-gray-900/5 group touch-pan-y"
      onPointerDown={onPointerDown}
    >
      <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      
      {/* Layer 1: Before Image (Background) — lazy: component is below the fold */}
      <img
        src={beforeImage}
        alt="Original Photo"
        width={1086}
        height={1448}
        decoding="async"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Layer 2: After Image (Foreground with hardware-accelerated clip-path masking) */}
      <motion.div
        className="absolute inset-0 z-10 will-change-transform"
        style={{ clipPath }}
      >
        <img
          src={afterImage}
          alt="AI Processed Photo"
          width={1086}
          height={1448}
          decoding="async"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      </motion.div>
      
      {/* Interactive Drag Handle */}
      <motion.div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 flex items-center justify-center pointer-events-none shadow-[0_0_15px_rgba(0,0,0,0.2)]"
        style={{ left: leftPos, x: "-50%" }}
      >
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-200 text-slate-600 transition-transform group-hover:scale-110">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
             <path d="m15 18 6-6-6-6"/>
             <path d="m9 18-6-6 6-6"/>
           </svg>
        </div>
      </motion.div>
      
      {/* Badges / Labels */}
      <div className="absolute top-6 left-6 z-20 bg-slate-900/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-semibold pointer-events-none">
        Original (HP)
      </div>
      <div className="absolute top-6 right-6 z-20 bg-indigo-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-semibold pointer-events-none">
        ZenStudio Studio
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
