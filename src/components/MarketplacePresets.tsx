import { Share2, ArrowRight } from 'lucide-react';
import { ShopeeIcon, TokopediaIcon, TikTokIcon, InstagramIcon } from './MarketplaceIcons';

const ShopeeTokopediaIcon = () => (
  <div className="flex items-center justify-center gap-3">
    <ShopeeIcon className="w-12 h-12 md:w-14 md:h-14 drop-shadow-[0_0_15px_rgba(238,77,45,0.5)] transition-transform group-hover:scale-110" />
    <TokopediaIcon className="w-12 h-12 md:w-14 md:h-14 drop-shadow-[0_0_15px_rgba(0,170,91,0.5)] transition-transform group-hover:scale-110" />
  </div>
);

const TikTokBrandIcon = () => (
  <TikTokIcon className="w-14 h-14 md:w-16 md:h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-transform group-hover:scale-110" />
);

const InstagramBrandIcon = () => (
  <InstagramIcon className="w-14 h-14 md:w-16 md:h-16 drop-shadow-[0_0_15px_rgba(228,64,95,0.5)] transition-transform group-hover:scale-110" />
);

const presets = [
  { name: 'Shopee / Tokopedia', aspect: '1:1', w: 220, h: 220, icon: ShopeeTokopediaIcon },
  { name: 'TikTok Shop / IG Story', aspect: '9:16', w: 150, h: 260, icon: TikTokBrandIcon },
  { name: 'Instagram Feed', aspect: '4:5', w: 180, h: 225, icon: InstagramBrandIcon },
];

const MarketplacePresets = () => {
  return (
    <section className="py-16 md:py-24 bg-background border-t border-surface-border relative overflow-hidden text-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-xs font-mono text-secondary mb-6">
            <Share2 className="w-3.5 h-3.5" />
            <span>OMNICHANNEL READY</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-text mb-6 tracking-tight">Marketplace Export Engine</h2>
          <p className="text-xl text-text-muted max-w-2xl mx-auto font-medium">Satu klik auto-resize AI engine untuk mendapatkan semua resolusi tanpa memotong objek produk Anda.</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-10 md:gap-14">
          {presets.map((preset) => (
            <div key={preset.name} className="flex flex-col items-center group cursor-pointer">
              <div
                className="bg-surface/40 border border-surface-border rounded-[24px] relative overflow-hidden flex items-center justify-center mb-6 group-hover:border-primary/50 group-active:border-primary/50 group-hover:shadow-[0_0_40px_rgba(212,69,42,0.12)] group-active:shadow-[0_0_40px_rgba(212,69,42,0.12)] transition-all duration-500 group-hover:-translate-y-2 group-active:-translate-y-2"
                style={{ width: preset.w, height: preset.h }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-secondary/5 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500" />

                {/* Grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

                {/* Optimized Badge inside card */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500 z-20">
                  <span className="text-[9px] font-mono font-bold bg-secondary/10 text-secondary border border-secondary/50 px-2 py-0.5 rounded">
                    OPTIMIZED
                  </span>
                </div>

                <div className="relative z-10 p-4">
                  <preset.icon />
                </div>

                {/* Scanning line animation on hover */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(212,69,42,0.6)] opacity-0 group-hover:opacity-100 group-active:opacity-100 group-hover:animate-[scan_2s_ease-in-out_infinite] group-active:animate-[scan_2s_ease-in-out_infinite]" />
              </div>
              <h4 className="text-text font-bold text-lg mb-2 group-hover:text-primary transition-colors font-sans">{preset.name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full">
                  {preset.aspect}
                </span>
                <span className="opacity-0 group-hover:opacity-100 group-active:opacity-100 -translate-x-2 group-hover:translate-x-0 group-active:translate-x-0 transition-all duration-300">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketplacePresets;
