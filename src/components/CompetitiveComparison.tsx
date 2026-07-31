import { Check, X, ShieldAlert, Aperture, Fingerprint, Type, Maximize, Activity, Wand2 } from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';

const features = [
  { name: 'Kualitas Foto Studio 4K', icon: Aperture, prodify: true, others: true },
  { name: 'Neural Preservation (Bentuk Asli)', icon: Fingerprint, prodify: true, others: false },
  { name: 'OCR & Label Protection', icon: Type, prodify: true, others: false },
  { name: 'Auto-Resize Semua Marketplace', icon: Maximize, prodify: true, others: 'Partial' },
  { name: 'Authenticity Score Report', icon: Activity, prodify: true, others: false },
  { name: 'Lifestyle Scene Generation', icon: Wand2, prodify: true, others: true },
];

const CompetitiveComparison = () => {
  return (
    <section className="py-16 md:py-24 bg-slate-950 border-t border-slate-800/80 relative overflow-hidden text-slate-200">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(8,145,178,0.15)_0%,transparent_70%)] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[radial-gradient(circle,rgba(79,70,229,0.15)_0%,transparent_70%)] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-xs font-mono text-indigo-300 mb-6 backdrop-blur-md">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            <span>INDUSTRY BENCHMARK</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Kenapa Memilih Prodify?</h2>
          
          <p className="text-lg text-slate-400 font-medium text-center max-w-2xl mx-auto">
            Lihat sendiri perbedaannya. Prodify menyulap foto seadanya menjadi standar studio profesional dengan <span className="text-cyan-400 font-bold">100% perlindungan bentuk produk</span>.
          </p>
        </div>

        <div className="mb-16 rounded-3xl p-4 md:p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <BeforeAfterSlider 
            beforeImage="/earfun-before.jpg" 
            afterImage="/earfun-after.jpg" 
          />
        </div>
        
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800/80 max-w-4xl mx-auto overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50">
                  <th className="p-4 md:p-6 text-slate-400 font-semibold w-[45%]">
                    Parameter Perbandingan
                  </th>
                <th className="p-4 md:p-6 text-center bg-indigo-950/40 border-l border-r border-indigo-500/20 relative">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-indigo-500" />
                  <div className="flex flex-col items-center gap-1">
                    <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 mb-1">
                      <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 drop-shadow-sm">Prodify</span>
                  </div>
                </th>
                <th className="p-4 md:p-6 text-center text-slate-500 font-semibold">
                  <div className="flex flex-col items-center gap-1 opacity-70">
                    <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 mb-1">
                      <X className="w-4 h-4 text-slate-400" />
                    </div>
                    <span>AI Lainnya</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, i) => (
                <tr key={i} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4 md:p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-inner group-hover:border-cyan-500/40 group-hover:bg-cyan-950/40 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all">
                        <item.icon className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <span className="text-slate-300 text-sm md:text-base font-semibold group-hover:text-cyan-100 transition-colors">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-4 md:p-6 text-center bg-indigo-950/20 border-l border-r border-indigo-500/10">
                    {item.prodify ? (
                      <div className="w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-500/30 mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <Check className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      </div>
                    ) : (
                      <X className="w-6 h-6 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-4 md:p-6 text-center">
                    {item.others === true ? (
                      <Check className="w-6 h-6 text-slate-500 mx-auto" />
                    ) : item.others === false ? (
                      <div className="w-8 h-8 rounded-full bg-rose-950/30 border border-rose-500/20 mx-auto flex items-center justify-center">
                        <X className="w-5 h-5 text-rose-500" />
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm font-medium bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">{item.others}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompetitiveComparison;
