import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
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

  return (
    <section ref={sectionRef} id="integrity" className="py-16 md:py-24 relative overflow-hidden">
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
        {/* Dark gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mb-6 shadow-xl">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-sm">Product Integrity Engine™</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto font-medium drop-shadow">
            Banyak AI generator yang mengubah produk asli Anda dan membuat pelanggan kecewa. Prodify menjamin produk Anda tetap autentik 100%.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-[24px] p-8 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-t-4 border-t-blue-500">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-blue-500" />
              AI Boleh Mengubah
            </h3>
            <ul className="space-y-4">
              {['Background (Studio, Cafe, Alam)', 'Pencahayaan & Shadow (Lebih Dramatis)', 'Refleksi Meja / Lantai', 'Properti Pendukung (Bunga, Kayu, Daun)', 'Komposisi & Mood Keseluruhan'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-[24px] p-8 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-t-4 border-t-red-500">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-500" />
              AI Dilarang Mengubah
            </h3>
            <ul className="space-y-4">
              {['Bentuk Asli Produk', 'Warna Produk', 'Label & Tulisan (OCR Preserved)', 'Logo Brand', 'Motif & Tekstur Kemasan'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div ref={ringsRef} className="mt-16 bg-slate-900/50 backdrop-blur-md rounded-[24px] p-8 max-w-5xl mx-auto border border-white/10 shadow-2xl">
          <h4 className="text-center font-bold text-lg mb-8 text-white">Live Authenticity Score Validation</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ScoreRing label="Shape Match" value={99.8} scrollYProgress={ringsScrollY} />
            <ScoreRing label="Color Match" value={99.5} scrollYProgress={ringsScrollY} />
            <ScoreRing label="Logo Match" value={100} scrollYProgress={ringsScrollY} />
            <ScoreRing label="Label Match" value={99.9} scrollYProgress={ringsScrollY} />
          </div>
        </div>
      </div>
    </section>
  );
};

const ScoreRing = ({ label, value, scrollYProgress }: { label: string, value: number, scrollYProgress: MotionValue<number> }) => {
  const circumference = 282.743; // 2 * Math.PI * 45
  const targetOffset = circumference * (1 - value / 100);
  
  // Map scroll progress (0 to 1) to stroke dash offset (empty to filled)
  const strokeDashoffset = useTransform(scrollYProgress, [0, 1], [circumference, targetOffset]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 mb-3">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <motion.circle 
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke="#60A5FA" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={circumference} 
            style={{ strokeDashoffset }} 
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-extrabold text-white">{value}%</span>
        </div>
      </div>
      <span className="text-slate-300 font-semibold text-sm">{label}</span>
    </div>
  );
};

export default IntegrityEngine;
