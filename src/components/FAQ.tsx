import { useState } from 'react';
import { ChevronDown, Terminal } from 'lucide-react';

const faqs = [
  {
    question: "Apa bedanya Prodify dengan AI Image Generator biasa?",
    answer: "AI generator umum sering meregenerasi seluruh gambar sehingga mengubah bentuk produk, logo, atau detail teks/label Anda. Prodify dilengkapi Product Integrity Engine™ yang mengunci 100% bentuk, warna, dan tulisan asli produk Anda, hanya mengubah latar belakang dan pencahayaan studio secara realistis."
  },
  {
    question: "Apakah foto hasil Prodify aman dari komplain pembeli?",
    answer: "Sangat aman! Setiap foto dilengkapi Authenticity Score Report yang memastikan tingkat kemiripan fisik produk 99%+. Pelanggan akan menerima produk fisik yang persis sama dengan yang ada di foto."
  },
  {
    question: "Berapa lama proses pembuatan foto produk di Prodify?",
    answer: "Proses pengolahan hanya membutuhkan waktu 15–30 detik per foto. Anda juga dapat menggunakan fitur Batch Processing untuk mengedit puluhan foto produk sekaligus."
  },
  {
    question: "Apakah bisa digunakan untuk ukuran Shopee, TikTok Shop, dan Instagram?",
    answer: "Ya! Prodify secara otomatis menyediakan Preset Ekspor Marketplace dalam rasio 1:1 (Shopee/Tokopedia), 9:16 (TikTok Shop/IG Story), dan 4:5 (Instagram Feed) tanpa memotong bagian penting produk Anda."
  },
  {
    question: "Apakah ada versi gratis?",
    answer: "Ada! Anda mendapatkan 3 foto gratis setiap bulan tanpa perlu memasukkan kartu kredit. Anda dapat mencoba semua fitur utama sebelum memutuskan untuk berlangganan."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-slate-950 border-t border-slate-800/80 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.15)_0%,transparent_70%)] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-xs font-mono text-cyan-300 mb-6 backdrop-blur-md">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>KNOWLEDGE BASE // FAQ</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Pertanyaan Sering Diajukan</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            Segala hal yang perlu Anda ketahui tentang Prodify dan teknologi <span className="text-cyan-400 font-bold">Product Integrity Engine™</span>.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-slate-900/80 backdrop-blur-md ${isOpen ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'border-slate-700/50 hover:border-slate-600/80'}`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-slate-800/50 transition-colors focus:outline-none group"
                >
                  <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-cyan-300' : 'text-slate-200 group-hover:text-cyan-100'}`}>{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-cyan-950/80 border border-cyan-500/50' : 'bg-slate-800 border border-slate-700'}`}>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-slate-400 leading-relaxed font-medium border-t border-slate-800/50 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
