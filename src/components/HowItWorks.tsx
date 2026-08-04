import { UploadCloud, Cpu, Download, ShieldCheck, Zap, Droplet, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef } from 'react';

const steps = [
  {
    title: 'Foto Pakai HP',
    desc: 'Foto produk Anda dengan pencahayaan seadanya. Tidak perlu background polos atau lighting khusus.',
    icon: UploadCloud,
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    iconGlow: 'shadow-[0_0_15px_rgba(99,102,241,0.3)]'
  },
  {
    title: 'AI Jaga Bentuk Asli',
    desc: 'Product Integrity Engine™ mengunci 100% bentuk, warna, dan teks produk. Hanya background yang diubah.',
    icon: ShieldCheck,
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    iconGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'
  },
  {
    title: 'Hasil Studio 4K',
    desc: 'Dapatkan 4 variasi foto profesional dalam 30 detik. Siap upload ke marketplace favorit Anda.',
    icon: Download,
    color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    iconGlow: 'shadow-[0_0_15px_rgba(14,165,233,0.3)]'
  }
];

const scoreItems = [
  { label: 'Akurasi Bentuk Asli', value: 99.8, color: '#6366F1', icon: ShieldCheck },
  { label: 'Konsistensi Warna', value: 99.5, color: '#06B6D4', icon: Droplet },
  { label: 'Keutuhan Logo', value: 100, color: '#10B981', icon: Award },
  { label: 'Ketajaman Teks', value: 99.9, color: '#F59E0B', icon: Zap }
];

const ScoreRing = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const circumference = 2 * Math.PI * 40; // r=40
  const offset = circumference * (1 - value / 100);

  return (
    <div className="flex flex-col items-center p-4 rounded-2xl glass-card hover:border-primary/40 transition-all">
      <div className="relative w-20 h-20 mb-3">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-surface-border" strokeWidth="7" />
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-extrabold text-text">{value}%</span>
          <span className="text-[10px] font-bold text-emerald-400 tracking-wide drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">LULUS</span>
        </div>
      </div>
      <span className="text-xs sm:text-sm text-text-muted font-semibold text-center leading-tight">{label}</span>
    </div>
  );
};

const HowItWorks = () => {
  const ringsRef = useRef<HTMLDivElement>(null);

  return (
    <section id="cara-kerja" className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.06)_0%,transparent_70%)] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-surface-border text-xs font-semibold text-primary mb-5 mx-auto shadow-sm">
            <Cpu className="w-3.5 h-3.5" />
            <span>CARA KERJA</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-text mb-4 tracking-tight">
            Dari HP ke Foto Studio dalam 30 Detik
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Tiga langkah mudah mengubah foto produk biasa menjadi gambar profesional siap jual.
          </p>
        </div>

        {/* Steps — horizontal snap scroll on mobile, 3-col on tablet+ */}
        <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 gap-6 md:gap-8 pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none max-w-5xl mx-auto">
          {steps.map((step, i) => {
            const IconComp = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="snap-start shrink-0 w-[85vw] max-w-[360px] md:w-auto md:max-w-none flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl glass-card hover:border-primary/30 transition-all"
              >
                {/* Step number */}
                <div className="w-10 h-10 rounded-full bg-primary text-white font-display font-extrabold text-sm flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                  {i + 1}
                </div>
                {/* Icon */}
                <div className={`p-4 rounded-2xl border ${step.color} mb-5 ${step.iconGlow}`}>
                  <IconComp className="w-7 h-7" />
                </div>
                <h3 className="font-display text-lg font-extrabold text-text mb-2">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Rings — Authenticity Scores */}
        <div ref={ringsRef} className="mt-16 md:mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-4 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% AMAN — VERIFIKASI COMPUTER VISION
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-extrabold text-text mb-2">Skor Keaslian Produk</h3>
            <p className="text-text-muted/80 text-sm">Setiap foto melewati 4 lapis verifikasi otomatis sebelum hasil akhir.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {scoreItems.map((item) => (
              <ScoreRing key={item.label} label={item.label} value={item.value} color={item.color} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
