import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

const IntegrityEngine = () => {
  return (
    <section id="integrity" className="py-24 bg-white relative border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-white border border-gray-200 rounded-2xl mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Product Integrity Engine™</h2>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium">
            Banyak AI generator yang mengubah produk asli Anda dan membuat pelanggan kecewa. Prodify menjamin produk Anda tetap autentik 100%.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-t-4 border-t-indigo-500">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-indigo-500" />
              AI Boleh Mengubah
            </h3>
            <ul className="space-y-4">
              {['Background (Studio, Cafe, Alam)', 'Pencahayaan & Shadow (Lebih Dramatis)', 'Refleksi Meja / Lantai', 'Properti Pendukung (Bunga, Kayu, Daun)', 'Komposisi & Mood Keseluruhan'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-t-4 border-t-red-500">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-500" />
              AI Dilarang Mengubah
            </h3>
            <ul className="space-y-4">
              {['Bentuk Asli Produk', 'Warna Produk', 'Label & Tulisan (OCR Preserved)', 'Logo Brand', 'Motif & Tekstur Kemasan'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 bg-slate-50 rounded-[24px] p-8 max-w-5xl mx-auto border border-gray-100 shadow-sm">
          <h4 className="text-center font-bold text-lg mb-8 text-slate-900">Live Authenticity Score Validation</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ScoreRing label="Shape Match" value={99.8} />
            <ScoreRing label="Color Match" value={99.5} />
            <ScoreRing label="Logo Match" value={100} />
            <ScoreRing label="Label Match" value={99.9} />
          </div>
        </div>
      </div>
    </section>
  );
};

const ScoreRing = ({ label, value }: { label: string, value: number }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="relative w-24 h-24 mb-3">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="8" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="#3B82F6" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - value/100)} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-extrabold text-primary">{value}%</span>
      </div>
    </div>
    <span className="text-text-muted font-semibold text-sm">{label}</span>
  </div>
);

export default IntegrityEngine;
