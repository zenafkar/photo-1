import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ZoomableImageProps {
  src: string;
  onClose: () => void;
}

export default function ZoomableImage({ src, onClose }: ZoomableImageProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));
  const handleReset = () => setScale(1);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Mencegah scroll halaman
      if (e.deltaY < 0) {
        setScale(prev => Math.min(prev + 0.25, 5));
      } else {
        setScale(prev => Math.max(prev - 0.25, 1));
      }
    };
    
    const element = containerRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (element) {
        element.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 overflow-hidden"
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
      >
        <motion.img
          src={src}
          alt="Enlarged Result"
          drag={scale > 1} // Hanya bisa di-drag saat di-zoom
          dragConstraints={containerRef}
          dragElastic={0.1}
          animate={{ scale }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`max-w-[90vw] max-h-[90dvh] object-contain rounded-lg shadow-2xl touch-manipulation ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          onClick={(e) => e.stopPropagation()} // Supaya klik gambar tidak menutup modal
          onDoubleClick={(e) => {
            e.stopPropagation();
            scale > 1 ? handleReset() : handleZoomIn();
          }}
        />

        {/* Floating Controls */}
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface/90 p-2 rounded-2xl border border-surface-border shadow-2xl mb-[env(safe-area-inset-bottom)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleZoomOut} className="p-3 hover:bg-white/10 text-white rounded-xl transition-all" title="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <div className="px-4 text-white font-medium text-sm font-mono min-w-[80px] text-center select-none">
            {Math.round(scale * 100)}%
          </div>
          
          <button onClick={handleZoomIn} className="p-3 hover:bg-white/10 text-white rounded-xl transition-all" title="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <div className="w-px h-8 bg-white/20 mx-1"></div>
          
          <button onClick={handleReset} className="p-3 hover:bg-white/10 text-white rounded-xl transition-all" title="Reset Zoom">
            <Maximize className="w-5 h-5" />
          </button>
        </div>

        {/* Close Button */}
        <button 
          className="absolute top-6 right-6 p-3 bg-surface/80 hover:bg-primary text-text-muted hover:text-white rounded-full transition-colors shadow-lg border border-surface-border hover:border-primary mt-[env(safe-area-inset-top)]"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
