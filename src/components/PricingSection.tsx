import { Zap, FastForward, Check, CreditCard, Sparkles } from 'lucide-react';
import { SignedOut, SignedIn, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { useTopUp } from '../context/TopUpContext';
import { PACKAGES, formatRupiah } from '../lib/packages';

const PricingSection = () => {
  const { openSignIn, openSignUp } = useClerk();
  const { openTopUp } = useTopUp();
  const handleOpenAuth = () => {
    try {
      if (typeof openSignUp === 'function') {
        openSignUp({ fallbackRedirectUrl: '/studio' });
      } else if (typeof openSignIn === 'function') {
        openSignIn({ fallbackRedirectUrl: '/studio' });
      }
    } catch (e) {
      console.error("Auth modal error:", e);
    }
  };

  const coreFeatures = [
    "Akses ke seluruh AI Engine (Termasuk OpenAI Image 1.5 & Nano Banana Pro)",
    "Resolusi ekspor Ultra 4K",
    "Bebas watermark komersial",
    "Proteksi OCR & Geometri 100%",
    "Lisensi komersial penuh"
  ];

  return (
    <section data-component="pricing" id="harga" className="py-24 lg:py-32 bg-landing-bg relative overflow-hidden text-landing-text border-t border-landing-border">
      
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 lg:mb-24 gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-landing-surface/50 border border-landing-border mb-6">
              <CreditCard className="w-3.5 h-3.5 text-landing-primary" />
              <span className="text-[10px] uppercase tracking-widest font-mono text-landing-text-muted">Kredit, Bukan Langganan</span>
            </div>
            <h2 className="font-landing-display text-4xl lg:text-5xl font-light text-landing-text mb-4 tracking-tight">
              Rate Card Studio
            </h2>
            <p className="text-lg text-landing-text-muted max-w-xl font-light">
              Beli kredit pemrosesan hanya saat Anda membutuhkannya. Tanpa biaya bulanan tersembunyi. <strong className="text-landing-text font-normal">1 Kredit = 1 Render Final.</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left: Core Specifications */}
          <div className="lg:col-span-5 border border-landing-border bg-landing-surface/20 p-8 lg:p-10 backdrop-blur-sm">
            <h3 className="font-mono text-[10px] tracking-widest text-landing-text-muted mb-8 uppercase border-b border-landing-border pb-4">Standard Specifications</h3>
            <ul className="space-y-6">
              {coreFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <Check className="w-5 h-5 text-landing-secondary shrink-0 mt-0.5" />
                  <span className="text-sm font-light text-landing-text/90 leading-relaxed">{feat}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-12 pt-8 border-t border-landing-border">
              <h4 className="font-mono text-[10px] tracking-widest text-landing-text-muted mb-4 uppercase">Free Trial Allocation</h4>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-landing-display mb-1">3 Credits</div>
                  <div className="text-xs text-landing-text-muted font-light">Diberikan saat registrasi awal</div>
                </div>
                <SignedOut>
                  <button onClick={handleOpenAuth} className="text-xs font-bold text-landing-primary hover:text-landing-primary/80 uppercase tracking-wider font-mono">
                    CLAIM NOW &rarr;
                  </button>
                </SignedOut>
                <SignedIn>
                  <Link to="/studio" className="text-xs font-bold text-landing-primary hover:text-landing-primary/80 uppercase tracking-wider font-mono">
                    ENTER STUDIO &rarr;
                  </Link>
                </SignedIn>
              </div>
            </div>
          </div>

          {/* Right: The Rate Cards */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Starter Package */}
            <div className="border border-landing-border bg-landing-surface/40 hover:bg-landing-surface/60 transition-colors p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 group">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-landing-text-muted mb-2 uppercase">Volume: {PACKAGES.starter.credits} Renders</div>
                <h3 className="font-landing-display text-3xl text-landing-text mb-2">Starter Pack</h3>
                <div className="font-mono text-sm text-landing-text-muted/70">{formatRupiah(PACKAGES.starter.price)}</div>
              </div>
              <div className="w-full sm:w-auto shrink-0">
                <SignedOut>
                  <button onClick={handleOpenAuth} className="w-full sm:w-[160px] py-4 bg-landing-bg border border-landing-border group-hover:border-landing-text text-landing-text text-xs font-mono tracking-widest uppercase transition-all">
                    Purchase
                  </button>
                </SignedOut>
                <SignedIn>
                  <button onClick={() => openTopUp("starter")} className="w-full sm:w-[160px] py-4 bg-landing-bg border border-landing-border group-hover:border-landing-text text-landing-text text-xs font-mono tracking-widest uppercase transition-all">
                    Purchase
                  </button>
                </SignedIn>
              </div>
            </div>

            {/* Pro Package */}
            <div className="border border-landing-primary bg-landing-primary/5 relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 group">
              <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-landing-primary px-3 py-1 text-[9px] font-bold font-mono tracking-widest text-landing-bg uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,69,42,0.4)]">
                <Sparkles className="w-3 h-3" /> BEST VALUE
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-widest text-landing-primary mb-2 uppercase flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Volume: {PACKAGES.pro.credits} Renders
                </div>
                <h3 className="font-landing-display text-3xl text-landing-text mb-2">Pro Batch</h3>
                <div className="font-mono text-sm text-landing-text-muted/70">{formatRupiah(PACKAGES.pro.price)}</div>
                <div className="mt-3 flex items-center gap-2 text-xs font-light text-landing-text-muted">
                  <FastForward className="w-3.5 h-3.5 text-landing-secondary" /> Priority GPU Queue
                </div>
              </div>
              <div className="w-full sm:w-auto shrink-0">
                <SignedOut>
                  <button onClick={handleOpenAuth} className="w-full sm:w-[160px] py-4 bg-landing-primary hover:bg-landing-primary/90 text-landing-bg text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(212,69,42,0.2)]">
                    Purchase
                  </button>
                </SignedOut>
                <SignedIn>
                  <button onClick={() => openTopUp("pro")} className="w-full sm:w-[160px] py-4 bg-landing-primary hover:bg-landing-primary/90 text-landing-bg text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(212,69,42,0.2)]">
                    Purchase
                  </button>
                </SignedIn>
              </div>
            </div>

          </div>
        </div>

        {/* Accepted Payment Methods (Monochrome/Technical style) */}
        <div className="mt-20 pt-8 border-t border-landing-border flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-mono tracking-widest text-landing-text-muted uppercase">Secure Transactions Via</div>
          <div className="flex items-center gap-6 opacity-50 grayscale">
            <span className="text-xs font-bold tracking-widest">QRIS</span>
            <span className="text-xs font-bold tracking-widest">GOPAY</span>
            <span className="text-xs font-bold tracking-widest">OVO</span>
            <span className="text-xs font-bold tracking-widest">VIRTUAL ACCOUNT</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PricingSection;
