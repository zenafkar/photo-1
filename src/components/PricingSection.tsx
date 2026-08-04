import { Sparkles, Zap, Image as ImageIcon, Layers, Aperture, Shield, FastForward, CreditCard } from 'lucide-react';
import { SignedOut, SignedIn, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { useTopUp } from '../context/TopUpContext';

const PricingSection = () => {
  const { openSignIn, openSignUp } = useClerk();
  const { openTopUp } = useTopUp();
  const handleOpenAuth = () => {
    try {
      if (typeof openSignUp === 'function') {
        openSignUp({ fallbackRedirectUrl: '/studio', signInFallbackRedirectUrl: '/studio' });
      } else if (typeof openSignIn === 'function') {
        openSignIn({ fallbackRedirectUrl: '/studio', signUpFallbackRedirectUrl: '/studio' });
      }
    } catch (e) {
      console.error("Auth modal error:", e);
    }
  };

  return (
    <section id="harga" className="py-16 md:py-24 bg-background relative overflow-hidden text-text">
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.06)_0%,transparent_70%)] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-surface-border text-xs font-semibold text-primary mb-5 shadow-sm">
            <CreditCard className="w-3.5 h-3.5" />
            <span>KREDIT, BUKAN LANGGANAN</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-text mb-4 tracking-tight">
            Top Up Sesuai Kebutuhan
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            <strong className="text-text">1 kredit = 1 foto.</strong> Beli kredit sekali, pakai kapan saja. Tanpa komitmen bulanan — lebih hemat untuk UMKM.
          </p>
        </div>

        {/* Pricing Cards — single column on mobile, 3-col on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">

          {/* Free Tier */}
          <div className="glass-card rounded-[28px] p-6 sm:p-8 flex flex-col shadow-sm hover:border-primary/40 transition-all">
            <h3 className="font-display text-xl font-extrabold text-text mb-1">Gratis</h3>
            <p className="text-text-muted text-sm mb-5">Cocok untuk mencoba dan jualan santai.</p>
            <div className="mb-6">
              <span className="font-display text-4xl font-extrabold text-text">3 Foto</span>
              <span className="text-text-muted/70 text-sm ml-2">gratis</span>
            </div>

            <ul className="space-y-3 mb-8 flex-grow text-sm">
              <li className="flex gap-3 text-text-muted/90"><ImageIcon className="w-5 h-5 text-primary shrink-0" /> 3 kredit gratis saat daftar</li>
              <li className="flex gap-3 text-text-muted/90"><Layers className="w-5 h-5 text-primary shrink-0" /> Bebas atur tema & suasana</li>
              <li className="flex gap-3 text-text-muted/90"><Aperture className="w-5 h-5 text-primary shrink-0" /> Resolusi 1K / 2K</li>
              <li className="flex gap-3 text-text-muted/90"><Shield className="w-5 h-5 text-primary shrink-0" /> Tanpa watermark</li>
            </ul>

            <SignedOut>
              <button onClick={handleOpenAuth} className="w-full py-3.5 rounded-xl border-2 border-surface-border hover:border-primary/50 text-text font-bold hover:bg-surface transition-all cursor-pointer min-h-[48px]">
                Mulai Gratis
              </button>
            </SignedOut>
            <SignedIn>
              <Link to="/studio" className="w-full py-3.5 rounded-xl border-2 border-surface-border hover:border-primary/50 text-text font-bold flex justify-center hover:bg-surface transition-all min-h-[48px]">
                Mulai Gratis
              </Link>
            </SignedIn>
          </div>

          {/* Starter Tier */}
          <div className="glass-card rounded-[28px] p-6 sm:p-8 flex flex-col shadow-sm hover:border-primary/40 transition-all">
            <h3 className="font-display text-xl font-extrabold text-text mb-1">Starter</h3>
            <p className="text-text-muted text-sm mb-5">Untuk UMKM yang ingin hasil profesional.</p>
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold text-text">Rp 75K</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-primary font-bold text-sm bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                  10 Foto
                </span>
                <span className="text-text-muted/70 text-xs">≈ Rp 7.500/foto</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-grow text-sm">
              <li className="flex gap-3 text-text font-medium"><Zap className="w-5 h-5 text-primary shrink-0" /> <strong>10 kredit</strong></li>
              <li className="flex gap-3 text-text-muted/90">Bebas atur tema & suasana</li>
              <li className="flex gap-3 text-text-muted/90">Resolusi 1K & 2K</li>
              <li className="flex gap-3 text-text-muted/90">Dukungan 4K (2 kredit)</li>
              <li className="flex gap-3 text-text-muted/90">Tanpa watermark</li>
            </ul>

            <SignedOut>
              <button onClick={handleOpenAuth} className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold transition-all shadow-[0_2px_15px_rgba(79,70,229,0.25)] hover:shadow-[0_4px_20px_rgba(79,70,229,0.35)] cursor-pointer min-h-[48px]">
                Beli Paket
              </button>
            </SignedOut>
            <SignedIn>
              <button onClick={() => openTopUp("starter")} className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold flex justify-center transition-all shadow-[0_2px_15px_rgba(79,70,229,0.25)] hover:shadow-[0_4px_20px_rgba(79,70,229,0.35)] cursor-pointer min-h-[48px]">
                Beli Paket
              </button>
            </SignedIn>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="glass-card rounded-[28px] p-6 sm:p-8 border-2 border-primary relative flex flex-col shadow-[0_0_30px_rgba(79,70,229,0.15)] md:-translate-y-2">
            {/* Popular badge */}
            <div className="absolute top-0 right-6 sm:right-8 transform -translate-y-1/2 bg-gradient-to-r from-primary to-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-[0_4px_15px_rgba(79,70,229,0.4)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> PALING HEMAT
            </div>
            <h3 className="font-display text-xl font-extrabold text-text mb-1">Pro</h3>
            <p className="text-text-muted text-sm mb-5">Untuk online shop dengan posting rutin.</p>
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold text-text">Rp 215K</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[#42B549] font-bold text-sm bg-[#42B549]/10 border border-[#42B549]/20 px-3 py-1 rounded-full">
                  30 Foto
                </span>
                <span className="text-text-muted/70 text-xs">≈ Rp 7.200/foto</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-grow text-sm">
              <li className="flex gap-3 text-text font-medium"><Zap className="w-5 h-5 text-primary shrink-0" /> <strong>30 kredit</strong></li>
              <li className="flex gap-3 text-text-muted/90">Bebas atur tema & suasana</li>
              <li className="flex gap-3 text-text-muted/90">Resolusi 1K & 2K</li>
              <li className="flex gap-3 text-text-muted/90">Dukungan Ultra 4K</li>
              <li className="flex gap-3 text-text-muted/90"><FastForward className="w-5 h-5 text-primary shrink-0" /> Priority server (lebih cepat)</li>
              <li className="flex gap-3 text-text-muted/90">Tanpa watermark</li>
            </ul>

            <SignedOut>
              <button onClick={handleOpenAuth} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary-dark hover:to-primary text-white font-bold transition-all shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.5)] cursor-pointer min-h-[48px]">
                Beli Paket Pro
              </button>
            </SignedOut>
            <SignedIn>
              <button onClick={() => openTopUp("pro")} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary-dark hover:to-primary text-white font-bold flex justify-center transition-all shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.5)] cursor-pointer min-h-[48px]">
                Beli Paket Pro
              </button>
            </SignedIn>
          </div>
        </div>

        {/* Payment methods + CTA note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-text-muted/80 mb-3">Pembayaran mudah via</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs font-medium text-text-muted">
              <img src="/icons/xendit.svg" alt="" className="w-4 h-4 brightness-0 invert opacity-70" /> QRIS
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs font-medium text-text-muted">
              📱 GoPay / OVO / Dana
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs font-medium text-text-muted">
              🏦 Transfer Bank
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
