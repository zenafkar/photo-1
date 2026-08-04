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
    <section id="harga" className="py-16 md:py-24 bg-white border-t border-stone-200 relative overflow-hidden text-stone-800">
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.04)_0%,transparent_70%)] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-5">
            <CreditCard className="w-3.5 h-3.5" />
            <span>KREDIT, BUKAN LANGGANAN</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-stone-900 mb-4 tracking-tight">
            Top Up Sesuai Kebutuhan
          </h2>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            <strong className="text-stone-700">1 kredit = 1 foto.</strong> Beli kredit sekali, pakai kapan saja. Tanpa komitmen bulanan — lebih hemat untuk UMKM.
          </p>
        </div>

        {/* Pricing Cards — single column on mobile, 3-col on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">

          {/* Free Tier */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-stone-200 flex flex-col shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
            <h3 className="text-xl font-extrabold text-stone-900 mb-1">Gratis</h3>
            <p className="text-stone-500 text-sm mb-5">Cocok untuk mencoba dan jualan santai.</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-stone-900">3 Foto</span>
              <span className="text-stone-400 text-sm ml-2">gratis</span>
            </div>

            <ul className="space-y-3 mb-8 flex-grow text-sm">
              <li className="flex gap-3 text-stone-600"><ImageIcon className="w-5 h-5 text-indigo-500 shrink-0" /> 3 kredit gratis saat daftar</li>
              <li className="flex gap-3 text-stone-600"><Layers className="w-5 h-5 text-indigo-500 shrink-0" /> Bebas atur tema & suasana</li>
              <li className="flex gap-3 text-stone-600"><Aperture className="w-5 h-5 text-indigo-500 shrink-0" /> Resolusi 1K / 2K</li>
              <li className="flex gap-3 text-stone-600"><Shield className="w-5 h-5 text-indigo-500 shrink-0" /> Tanpa watermark</li>
            </ul>

            <SignedOut>
              <button onClick={handleOpenAuth} className="w-full py-3.5 rounded-xl border-2 border-stone-200 hover:border-indigo-300 text-stone-700 font-bold hover:bg-indigo-50 transition-all cursor-pointer min-h-[48px]">
                Mulai Gratis
              </button>
            </SignedOut>
            <SignedIn>
              <Link to="/studio" className="w-full py-3.5 rounded-xl border-2 border-stone-200 hover:border-indigo-300 text-stone-700 font-bold flex justify-center hover:bg-indigo-50 transition-all min-h-[48px]">
                Mulai Gratis
              </Link>
            </SignedIn>
          </div>

          {/* Starter Tier */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-stone-200 flex flex-col shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
            <h3 className="text-xl font-extrabold text-stone-900 mb-1">Starter</h3>
            <p className="text-stone-500 text-sm mb-5">Untuk UMKM yang ingin hasil profesional.</p>
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-stone-900">Rp 75K</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-indigo-700 font-bold text-sm bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                  10 Foto
                </span>
                <span className="text-stone-400 text-xs">≈ Rp 7.500/foto</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-grow text-sm">
              <li className="flex gap-3 text-stone-700 font-medium"><Zap className="w-5 h-5 text-indigo-500 shrink-0" /> <strong>10 kredit</strong></li>
              <li className="flex gap-3 text-stone-600">Bebas atur tema & suasana</li>
              <li className="flex gap-3 text-stone-600">Resolusi 1K & 2K</li>
              <li className="flex gap-3 text-stone-600">Dukungan 4K (2 kredit)</li>
              <li className="flex gap-3 text-stone-600">Tanpa watermark</li>
            </ul>

            <SignedOut>
              <button onClick={handleOpenAuth} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-[0_2px_10px_rgba(79,70,229,0.2)] hover:shadow-[0_4px_15px_rgba(79,70,229,0.3)] cursor-pointer min-h-[48px]">
                Beli Paket
              </button>
            </SignedOut>
            <SignedIn>
              <button onClick={() => openTopUp("starter")} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex justify-center transition-all shadow-[0_2px_10px_rgba(79,70,229,0.2)] hover:shadow-[0_4px_15px_rgba(79,70,229,0.3)] cursor-pointer min-h-[48px]">
                Beli Paket
              </button>
            </SignedIn>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border-2 border-indigo-500 relative flex flex-col shadow-[0_8px_30px_rgba(79,70,229,0.1)] md:-translate-y-2">
            {/* Popular badge */}
            <div className="absolute top-0 right-6 sm:right-8 transform -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-[0_2px_10px_rgba(79,70,229,0.3)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> PALING HEMAT
            </div>
            <h3 className="text-xl font-extrabold text-stone-900 mb-1">Pro</h3>
            <p className="text-stone-500 text-sm mb-5">Untuk online shop dengan posting rutin.</p>
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-stone-900">Rp 215K</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-emerald-700 font-bold text-sm bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  30 Foto
                </span>
                <span className="text-stone-400 text-xs">≈ Rp 7.200/foto</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-grow text-sm">
              <li className="flex gap-3 text-stone-700 font-medium"><Zap className="w-5 h-5 text-indigo-500 shrink-0" /> <strong>30 kredit</strong></li>
              <li className="flex gap-3 text-stone-600">Bebas atur tema & suasana</li>
              <li className="flex gap-3 text-stone-600">Resolusi 1K & 2K</li>
              <li className="flex gap-3 text-stone-600">Dukungan Ultra 4K</li>
              <li className="flex gap-3 text-stone-600"><FastForward className="w-5 h-5 text-indigo-500 shrink-0" /> Priority server (lebih cepat)</li>
              <li className="flex gap-3 text-stone-600">Tanpa watermark</li>
            </ul>

            <SignedOut>
              <button onClick={handleOpenAuth} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.4)] cursor-pointer min-h-[48px]">
                Beli Paket Pro
              </button>
            </SignedOut>
            <SignedIn>
              <button onClick={() => openTopUp("pro")} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold flex justify-center transition-all shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.4)] cursor-pointer min-h-[48px]">
                Beli Paket Pro
              </button>
            </SignedIn>
          </div>
        </div>

        {/* Payment methods + CTA note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-stone-400 mb-3">Pembayaran mudah via</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-medium text-stone-600">
              <img src="/icons/xendit.svg" alt="" className="w-4 h-4" /> QRIS
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-medium text-stone-600">
              📱 GoPay / OVO / Dana
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-medium text-stone-600">
              🏦 Transfer Bank
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
