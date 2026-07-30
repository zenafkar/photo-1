import { Check, Sparkles } from 'lucide-react';
import { SignInButton, SignedOut, SignedIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const PricingSection = () => {
  return (
    <section id="harga" className="py-12 md:py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Sistem Top Up, Bayar Sesuai Kebutuhan</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Beli kredit saat Anda butuh. Lebih hemat untuk UMKM, tanpa komitmen bulanan.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-[32px] p-8 lg:p-10 border border-gray-100 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Starter</h3>
            <p className="text-slate-500 mb-6 font-medium text-sm">Cocok untuk mencoba dan jualan santai.</p>
            <div className="mb-8">
              <span className="text-4xl font-extrabold text-slate-900">Gratis</span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> 3 Kredit (Redesign) per bulan</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Semi-Auto Mode (Pilih template)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Resolusi Standar (720p)</li>
              <li className="flex gap-3 text-slate-400 font-medium"><XIcon className="w-5 h-5 shrink-0" /> Watermark Prodify</li>
            </ul>
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full py-3.5 rounded-xl border-2 border-gray-200 text-slate-700 font-bold hover:bg-gray-50 transition-colors">
                  Mulai Gratis
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/studio" className="w-full py-3.5 rounded-xl border-2 border-gray-200 text-slate-700 font-bold flex justify-center hover:bg-gray-50 transition-colors">
                Mulai Gratis
              </Link>
            </SignedIn>
          </div>

          {/* Basic Tier */}
          <div className="bg-white rounded-[32px] p-8 lg:p-10 border border-gray-200 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Pemula</h3>
            <p className="text-slate-500 mb-6 font-medium text-sm">Untuk bisnis kecil yang mulai berkembang.</p>
            <div className="mb-8 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">Rp 49.000</span>
              </div>
              <span className="text-indigo-600 font-bold text-sm bg-indigo-50 inline-flex px-3 py-1 rounded-full w-fit mt-2">
                Dapat 50 Kredit (~Rp 980/foto)
              </span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> <strong>50 Kredit</strong> Saldo</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Custom Prompt (Ketik suasana)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Batch Processing (Edit banyak)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Ekspor Resolusi Tinggi</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Tanpa Watermark</li>
            </ul>
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-md hover:shadow-lg">
                  Beli Paket
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/studio" className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex justify-center transition-all shadow-md hover:shadow-lg">
                Beli Paket
              </Link>
            </SignedIn>
          </div>

          {/* Premium Tier */}
          <div className="bg-white rounded-[32px] p-8 lg:p-10 border-2 border-indigo-600 relative flex flex-col transform md:-translate-y-4 shadow-[0_20px_40px_rgb(79,70,229,0.15)]">
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" /> PALING POPULER
            </div>
            <h3 className="text-2xl font-extrabold text-indigo-600 mb-2">Profesional</h3>
            <p className="text-slate-500 mb-6 font-medium text-sm">Untuk UMKM serius yang ingin mendominasi.</p>
            <div className="mb-8 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">Rp 129.000</span>
              </div>
              <span className="text-green-700 font-bold text-sm bg-green-50 inline-flex px-3 py-1 rounded-full w-fit mt-2">
                Dapat 200 Kredit (~Rp 645/foto)
              </span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex gap-3 text-slate-900 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> <strong>200 Kredit</strong> Saldo</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Custom Prompt (Ketik suasana)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Batch Processing (Edit banyak)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Ekspor Resolusi 4K</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Priority Server (Lebih cepat)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Tanpa Watermark</li>
            </ul>
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  Beli Paket
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/studio" className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex justify-center transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                Beli Paket
              </Link>
            </SignedIn>
          </div>
        </div>
      </div>
    </section>
  );
};

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default PricingSection;
