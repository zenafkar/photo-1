import { Check, X } from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';

const features = [
  { name: 'Kualitas Foto Studio', prodify: true, others: true },
  { name: 'Tidak Mengubah Bentuk Produk', prodify: true, others: false },
  { name: 'Tidak Menghaluskan Logo/Label', prodify: true, others: false },
  { name: 'Auto-Resize Semua Marketplace', prodify: true, others: 'Partial' },
  { name: 'Authenticity Score Report', prodify: true, others: false },
  { name: 'Lifestyle Scene Generation', prodify: true, others: true },
];

const CompetitiveComparison = () => {
  return (
    <section className="py-12 md:py-16 bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 text-center">Kenapa Memilih Prodify?</h2>
        
        <p className="text-lg text-slate-500 font-medium text-center mb-12 max-w-2xl mx-auto">
          Lihat sendiri perbedaannya. Prodify menyulap foto seadanya menjadi standar studio profesional hanya dalam hitungan detik.
        </p>

        <div className="mb-16">
          <BeforeAfterSlider 
            beforeImage="/earfun-before.jpg" 
            afterImage="/earfun-after.jpg" 
          />
        </div>
        
        <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 max-w-4xl mx-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="p-6 text-slate-600 font-semibold w-1/2">Fitur / Kapabilitas</th>
                <th className="p-6 text-center bg-indigo-50 border-l border-r border-gray-200">
                  <span className="text-xl font-extrabold text-indigo-600">Prodify</span>
                </th>
                <th className="p-6 text-center text-slate-600 font-semibold">AI Generator Lain</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="p-6 text-slate-900 text-sm md:text-base font-semibold">{item.name}</td>
                  <td className="p-6 text-center bg-indigo-50/50 border-l border-r border-gray-200">
                    {item.prodify ? (
                      <Check className="w-6 h-6 text-indigo-600 mx-auto" />
                    ) : (
                      <X className="w-6 h-6 text-slate-400 mx-auto" />
                    )}
                  </td>
                  <td className="p-6 text-center">
                    {item.others === true ? (
                      <Check className="w-6 h-6 text-slate-400 mx-auto" />
                    ) : item.others === false ? (
                      <X className="w-6 h-6 text-red-500 mx-auto" />
                    ) : (
                      <span className="text-slate-500 text-sm font-medium">{item.others}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default CompetitiveComparison;
