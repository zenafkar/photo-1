import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="harga" className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Investasi Kecil, Omset Meroket</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 font-medium">Pilih paket yang sesuai dengan kebutuhan bisnis Anda. Bisa upgrade kapan saja.</p>
          
          <div className="inline-flex bg-white p-1.5 rounded-full border border-gray-200 shadow-sm">
            <button 
              onClick={() => setIsAnnual(false)} 
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${!isAnnual ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              Bulanan
            </button>
            <button 
              onClick={() => setIsAnnual(true)} 
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isAnnual ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              Tahunan <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${isAnnual ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-700'}`}>HEMAT 20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-[32px] p-8 lg:p-12 border border-gray-100 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Starter</h3>
            <p className="text-slate-500 mb-6 font-medium">Cocok untuk mencoba dan jualan santai.</p>
            <div className="mb-8">
              <span className="text-4xl font-extrabold text-slate-900">Gratis</span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> 10 Foto (Redesign) per bulan</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Semi-Auto Mode (Pilih template)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Resolusi Standar (720p)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Product Integrity Guarantee</li>
              <li className="flex gap-3 text-slate-400 font-medium"><XIcon className="w-5 h-5 shrink-0" /> Watermark Prodify</li>
            </ul>
            
            <button className="w-full py-4 rounded-xl border-2 border-gray-200 text-slate-700 font-bold hover:bg-gray-50 transition-colors">
              Mulai Gratis
            </button>
          </div>

          {/* Premium Tier */}
          <div className="bg-white rounded-[32px] p-8 lg:p-12 border-2 border-indigo-600 relative flex flex-col transform md:-translate-y-4 shadow-[0_20px_40px_rgb(79,70,229,0.15)]">
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" /> PALING POPULER
            </div>
            <h3 className="text-2xl font-extrabold text-indigo-600 mb-2">Premium Pro</h3>
            <p className="text-slate-500 mb-6 font-medium">Untuk UMKM serius yang ingin mendominasi.</p>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900">Rp {isAnnual ? '79.000' : '99.000'}</span>
              <span className="text-slate-500 font-medium">/bulan</span>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex gap-3 text-slate-900 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> <strong>Unlimited</strong> Foto* (Fair Use)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Custom Prompt (Ketik suasana)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Batch Processing (Edit banyak)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Ekspor Resolusi Tinggi (4K)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Priority Server (Lebih cepat)</li>
              <li className="flex gap-3 text-slate-700 font-medium"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Tanpa Watermark</li>
            </ul>
            
            <button className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Langganan Sekarang
            </button>
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
