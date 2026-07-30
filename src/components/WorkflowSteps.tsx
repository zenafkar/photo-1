import { UploadCloud, Sparkles, Download, CheckCircle2 } from 'lucide-react';

const steps = [
  { title: 'Upload Foto HP', desc: 'Foto produk Anda dengan pencahayaan seadanya. Tidak perlu background polos.', icon: UploadCloud },
  { title: 'AI Mendeteksi Produk', desc: 'Product Integrity Engine langsung mengenali dan mengunci produk Anda agar tidak berubah.', icon: CheckCircle2 },
  { title: 'Pilih Style', desc: 'Tentukan kategori dan vibe background yang sesuai dengan brand Anda.', icon: Sparkles },
  { title: 'Download & Jual', desc: 'Dapatkan 4 variasi foto profesional dalam hitungan detik. Siap upload.', icon: Download }
];

const WorkflowSteps = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-16 text-center">Cara Kerja Super Mudah</h2>
        
        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center relative z-10 mb-6 group hover:border-indigo-600 transition-colors">
                <step.icon className="w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSteps;
