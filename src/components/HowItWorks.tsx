import { UploadCloud, Cpu, Download, ShieldCheck, Zap, Droplet, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    title: 'Foto Pakai HP',
    desc: 'Foto produk Anda dengan pencahayaan seadanya. Tidak perlu background polos atau lighting khusus.',
    icon: UploadCloud,
    color: 'bg-primary/10 text-primary border-primary/20',
    iconGlow: 'shadow-[0_0_15px_rgba(212,69,42,0.2)]'
  },
  {
    title: 'AI Jaga Bentuk Asli',
    desc: 'Product Integrity Engine™ mengunci 100% bentuk, warna, dan teks produk. Hanya background yang diubah.',
    icon: ShieldCheck,
    color: 'bg-secondary/10 text-secondary border-secondary/20',
    iconGlow: 'shadow-[0_0_15px_rgba(61,139,125,0.2)]'
  },
  {
    title: 'Hasil Studio 4K',
    desc: 'Dapatkan 4 variasi foto profesional dalam 30 detik. Siap upload ke marketplace favorit Anda.',
    icon: Download,
    color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    iconGlow: 'shadow-[0_0_15px_rgba(14,165,233,0.2)]'
  }
];

const scoreItems = [
  { label: 'Akurasi Bentuk Asli', value: 99.8, color: '#D4452A', icon: ShieldCheck },
  { label: 'Konsistensi Warna', value: 99.5, color: '#3D8B7D', icon: Droplet },
  { label: 'Keutuhan Logo', value: 100, color: '#C7823A', icon: Award },
  { label: 'Ketajaman Teks', value: 99.9, color: '#38BDF8', icon: Zap }
];

const ScoreRing = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="flex flex-col items-center p-4 rounded-2xl bg-surface/40 border border-surface-border hover:border-primary/30 transition-colors">
      <div className="relative w-20 h-20 mb-3">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
          <span className="font-display text-xl font-bold text-text">{value}%</span>
          <span className="text-[10px] font-bold text-secondary tracking-wide">LULUS</span>
        </div>
      </div>
      <span className="text-xs sm:text-sm text-text-muted font-semibold text-center leading-tight">{label}</span>
    </div>
  );
};

const HowItWorks = () => {

  return (
    <section data-component="how-it-works" id="cara-kerja" className="py-16 md:py-24 bg-background relative overflow-hidden border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-surface-border text-xs font-semibold text-primary mb-5 mx-auto">
            <Cpu className="w-3.5 h-3.5" />
            <span>CARA KERJA</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-text mb-4 tracking-tight">
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
                className="snap-start shrink-0 w-[85vw] max-w-[360px] md:w-auto md:max-w-none flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl bg-surface/40 border border-surface-border hover:border-primary/30 transition-colors"
              >
                {/* Step number — restrained */}
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-sans font-bold text-sm flex items-center justify-center mb-4">
                  {i + 1}
                </div>
                {/* Icon */}
                <div className={`p-4 rounded-2xl border ${step.color} mb-5 ${step.iconGlow}`}>
                  <IconComp className="w-7 h-7" />
                </div>
                <h3 className="font-sans text-lg font-bold text-text mb-2">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Rings — Authenticity Scores */}
        <div className="mt-16 md:mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-xs font-semibold text-secondary mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% AMAN — VERIFIKASI COMPUTER VISION
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-text mb-2">Skor Keaslian Produk</h3>
            <p className="text-text-muted text-sm">Setiap foto melewati 4 lapis verifikasi otomatis sebelum hasil akhir.</p>
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
