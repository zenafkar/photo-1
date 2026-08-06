import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Database, TrendingUp, RefreshCw } from 'lucide-react';

const caseStudies = [
  {
    quote: "Label produk 100% utuh tanpa distorsi OCR. Konversi penjualan kami naik 45% setelah transisi ke visual berbasis AI.",
    author: "BUDI SANTOSO",
    role: "Top Seller Kategori F&B",
    metrics: [
      { label: "CONVERSION", value: "+45%", trend: "up" },
      { label: "COST/ASSET", value: "-80%", trend: "down" },
      { label: "TIME-TO-MARKET", value: "30s", trend: "neutral" }
    ]
  },
  {
    quote: "Satu-satunya sistem yang mempertahankan akurasi tekstur botol skincare kami. Pelanggan mendapatkan persis apa yang mereka lihat.",
    author: "SITI AMELIA",
    role: "Founder Kosmetik Lokal",
    metrics: [
      { label: "DELTA-E VARIANCE", value: "< 1.2", trend: "neutral" },
      { label: "CUSTOMER RETURNS", value: "0%", trend: "down" },
      { label: "ASSET VOLUME", value: "1.2K", trend: "up" }
    ]
  },
  {
    quote: "Otomatisasi ukuran ekspor ke TikTok dan Shopee sangat menghemat waktu. ROAS iklan kami mencapai rekor tertinggi.",
    author: "DENY PRATAMA",
    role: "TikTok Shop Fashion",
    metrics: [
      { label: "AD ROAS", value: "3.2x", trend: "up" },
      { label: "ENGAGEMENT", value: "+60%", trend: "up" },
      { label: "FORMAT EXPORT", value: "AUTO", trend: "neutral" }
    ]
  }
];

const globalStats = [
  { value: "10K+", numericTarget: 10000, format: "compact", label: "ACTIVE MERCHANTS", icon: Database },
  { value: "50K+", numericTarget: 50000, format: "compact", label: "ASSETS RENDERED", icon: Activity },
  { value: "99.8%", numericTarget: 99.8, format: "decimal", decimals: 1, label: "INTEGRITY SCORE", icon: TrendingUp },
  { value: "30s", numericTarget: 30, format: "integer", label: "AVG PROCESS TIME", icon: RefreshCw }
];

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function formatStat(value: number, format: string): string {
  switch (format) {
    case 'compact': {
      const k = value / 1000;
      return k >= 1 ? `${k}K+` : `${value}`;
    }
    case 'decimal':
      return `${value}%`;
    case 'integer':
      return `${value}s`;
    default:
      return `${value}`;
  }
}

const StatItem = ({ stat, index }: { stat: typeof globalStats[number]; index: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const Icon = stat.icon;

  useEffect(() => {
    const duration = 2000;
    const target = stat.numericTarget;
    const decimals = stat.decimals ?? 0;
    const delay = index * 200;
    const startTime = performance.now() + delay;
    let rafId: number;

    function animate(currentTime: number) {
      if (currentTime < startTime) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentValue = easedProgress * target;

      setDisplayValue(Number(currentValue.toFixed(decimals)));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [stat.numericTarget, stat.decimals, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-4"
    >
      <div className="mt-1 hidden sm:block">
        <Icon className="w-5 h-5 text-landing-text-muted/50" />
      </div>
      <div>
        <div className="font-landing-display text-3xl lg:text-4xl font-medium text-landing-text mb-1">
          {formatStat(displayValue, stat.format)}
        </div>
        <div className="text-[10px] font-mono tracking-widest text-landing-text-muted">{stat.label}</div>
      </div>
    </motion.div>
  );
};

const SocialProof = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % caseStudies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section data-component="social-proof" className="py-24 lg:py-32 bg-landing-bg border-t border-landing-border relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 lg:mb-24 gap-8">
          <div>
            <h2 className="font-landing-display text-sm tracking-[0.2em] text-landing-text-muted mb-2 uppercase">
              Performance Metrics
            </h2>
            <h3 className="font-landing-display text-4xl lg:text-5xl font-light text-landing-text">
              Dampak Terukur.<br />
              <span className="text-landing-primary">Bukan Sekadar Estetika.</span>
            </h3>
          </div>
          
          <div className="flex gap-2">
            {caseStudies.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => { setActiveIndex(idx); setIsPaused(true); }}
                className="w-12 h-1 px-0 py-2 relative group"
                aria-label={`View case study ${idx + 1}`}
              >
                <div className={`w-full h-full transition-all duration-300 ${activeIndex === idx ? 'bg-landing-primary' : 'bg-landing-border group-hover:bg-landing-text-muted'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* The Editorial Case Study Carousel */}
        <div 
          className="relative min-h-[500px] lg:min-h-[400px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col lg:flex-row gap-12 lg:gap-24"
            >
              {/* Quote Area */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="font-landing-display text-6xl md:text-8xl text-landing-surface/80 leading-none mb-6">"</div>
                <p className="font-landing-display text-2xl md:text-4xl lg:text-5xl font-light text-landing-text leading-[1.2] mb-12 -mt-10">
                  {caseStudies[activeIndex].quote}
                </p>
                <div className="flex items-center gap-4 border-l-2 border-landing-primary pl-4">
                  <div>
                    <div className="font-mono text-sm tracking-widest text-landing-text font-bold uppercase">{caseStudies[activeIndex].author}</div>
                    <div className="text-xs text-landing-text-muted">{caseStudies[activeIndex].role}</div>
                  </div>
                </div>
              </div>

              {/* Technical Metrics Sidebar */}
              <div className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-landing-border pt-8 lg:pt-0 lg:pl-12 flex flex-col justify-center gap-6">
                <div className="text-[10px] font-mono tracking-widest text-landing-text-muted mb-2">TELEMETRY DATA</div>
                {caseStudies[activeIndex].metrics.map((metric, idx) => (
                  <div key={idx} className="flex justify-between items-end border-b border-landing-surface pb-3">
                    <div className="text-xs font-mono text-landing-text-muted tracking-wider">{metric.label}</div>
                    <div className="flex items-baseline gap-2">
                      <div className="font-landing-display text-2xl text-landing-text leading-none">{metric.value}</div>
                      {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-landing-secondary" />}
                      {metric.trend === 'down' && <TrendingUp className="w-4 h-4 text-landing-primary rotate-180" />}
                      {metric.trend === 'neutral' && <div className="w-4 h-[2px] bg-landing-text-muted/50 mb-2" />}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Technical Stats */}
        <div className="mt-32 pt-12 border-t border-landing-border grid grid-cols-2 md:grid-cols-4 gap-8">
          {globalStats.map((stat, idx) => (
            <StatItem key={idx} stat={stat} index={idx} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default SocialProof;
