import { Sparkles, Zap, Image as ImageIcon, Layers, Aperture, Shield, Type, FastForward } from 'lucide-react';
import { SignInButton, SignedOut, SignedIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const PricingSection = () => {
  return (
    <section id="harga" className="py-16 md:py-24 bg-slate-950 border-t border-slate-800/80 relative overflow-hidden text-slate-200">
      {/* Glow Effects */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(8,145,178,0.15)_0%,transparent_70%)] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-xs font-mono text-cyan-300 mb-6 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>PAY PER COMPUTE</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Top Up AI Credits Sesuai Kebutuhan</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">Beli kredit saat Anda butuh. Lebih hemat untuk UMKM, tanpa komitmen bulanan.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-[32px] p-8 lg:p-10 border border-slate-700/50 flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-slate-500/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all">
            <h3 className="text-2xl font-extrabold text-slate-100 mb-2">Gratis</h3>
            <p className="text-slate-400 mb-6 font-medium text-sm">Cocok untuk mencoba dan jualan santai.</p>
            <div className="mb-8">
              <span className="text-4xl font-extrabold text-white">Trial</span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex gap-3 text-slate-300 font-medium"><ImageIcon className="w-5 h-5 text-cyan-500 shrink-0" /> 3 Kredit Gratis di awal (untuk generate 3 foto)</li>
              <li className="flex gap-3 text-slate-300 font-medium"><Layers className="w-5 h-5 text-cyan-500 shrink-0" /> Bebas Atur Tema & Suasana</li>
              <li className="flex gap-3 text-slate-300 font-medium"><Aperture className="w-5 h-5 text-cyan-500 shrink-0" /> Resolusi 1K / 2K</li>
              <li className="flex gap-3 text-slate-300 font-medium"><Shield className="w-5 h-5 text-cyan-500 shrink-0" /> Tanpa Watermark</li>
            </ul>
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 font-bold hover:bg-slate-800 transition-colors">
                  Mulai Gratis
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/studio" className="w-full py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 font-bold flex justify-center hover:bg-slate-800 transition-colors">
                Mulai Gratis
              </Link>
            </SignedIn>
          </div>

          {/* Basic Tier */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-[32px] p-8 lg:p-10 border border-slate-700/50 flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all">
            <h3 className="text-2xl font-extrabold text-slate-100 mb-2">Starter</h3>
            <p className="text-slate-400 mb-6 font-medium text-sm">Untuk UMKM yang ingin hasil profesional.</p>
            <div className="mb-8 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">Rp 75.000</span>
              </div>
              <span className="text-cyan-400 font-bold text-sm bg-cyan-950/50 border border-cyan-500/30 inline-flex px-3 py-1 rounded-full w-fit mt-2">
                Hingga 10x Generate Foto
              </span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex gap-3 text-slate-200 font-medium"><Zap className="w-5 h-5 text-cyan-400 shrink-0" /> Sistem <strong className="text-cyan-300">10 Kredit</strong></li>
              <li className="flex gap-3 text-slate-300 font-medium"><Type className="w-5 h-5 text-cyan-500 shrink-0" /> Bebas Atur Tema & Suasana</li>
              <li className="flex gap-3 text-slate-300 font-medium"><Aperture className="w-5 h-5 text-cyan-500 shrink-0" /> Ekspor Resolusi 1K & 2K</li>
              <li className="flex gap-3 text-slate-300 font-medium"><Layers className="w-5 h-5 text-cyan-500 shrink-0" /> Dukungan Resolusi 4K (2 Kredit)</li>
              <li className="flex gap-3 text-slate-300 font-medium"><Shield className="w-5 h-5 text-cyan-500 shrink-0" /> Tanpa Watermark</li>
            </ul>
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold transition-all shadow-md">
                  Beli Paket
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/studio" className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold flex justify-center transition-all shadow-md">
                Beli Paket
              </Link>
            </SignedIn>
          </div>

          {/* Premium Tier */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-[32px] p-8 lg:p-10 border border-cyan-500/50 relative flex flex-col transform md:-translate-y-4 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-100" /> PALING POPULER
            </div>
            <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 mb-2">Pro</h3>
            <p className="text-slate-400 mb-6 font-medium text-sm">Untuk online shop dengan posting rutin.</p>
            <div className="mb-8 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">Rp 215.000</span>
              </div>
              <span className="text-emerald-400 font-bold text-sm bg-emerald-950/50 border border-emerald-500/30 inline-flex px-3 py-1 rounded-full w-fit mt-2">
                Hingga 30x Generate Foto
              </span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex gap-3 text-slate-100 font-medium"><Zap className="w-5 h-5 text-cyan-400 shrink-0 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" /> Sistem <strong className="text-cyan-300">30 Kredit</strong></li>
              <li className="flex gap-3 text-slate-300 font-medium"><Type className="w-5 h-5 text-cyan-400 shrink-0" /> Bebas Atur Tema & Suasana</li>
              <li className="flex gap-3 text-slate-300 font-medium"><Aperture className="w-5 h-5 text-cyan-400 shrink-0" /> Ekspor Resolusi 1K & 2K</li>
              <li className="flex gap-3 text-slate-300 font-medium"><Layers className="w-5 h-5 text-cyan-400 shrink-0" /> Dukungan Resolusi Ultra 4K</li>
              <li className="flex gap-3 text-slate-300 font-medium"><FastForward className="w-5 h-5 text-cyan-400 shrink-0" /> Priority Server (Lebih cepat)</li>
              <li className="flex gap-3 text-slate-300 font-medium"><Shield className="w-5 h-5 text-cyan-400 shrink-0" /> Tanpa Watermark</li>
            </ul>
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:-translate-y-0.5 border border-cyan-400/50">
                  Beli Paket
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/studio" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold flex justify-center transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:-translate-y-0.5 border border-cyan-400/50">
                Beli Paket
              </Link>
            </SignedIn>
          </div>
        </div>
      </div>
    </section>
  );
};


export default PricingSection;
