import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    category: 'Umum',
    items: [
      {
        question: "Apa bedanya ZenStudio dengan AI Image Generator biasa?",
        answer: "AI generator umum sering meregenerasi seluruh gambar sehingga mengubah bentuk produk, logo, atau detail teks/label Anda. ZenStudio dilengkapi Product Integrity Engine™ yang mengunci 100% bentuk, warna, dan tulisan asli produk Anda, hanya mengubah latar belakang dan pencahayaan studio secara realistis."
      },
      {
        question: "Berapa lama proses pembuatan foto produk di ZenStudio?",
        answer: "Proses pengolahan hanya membutuhkan waktu 15–30 detik per foto. Anda juga dapat menggunakan fitur Batch Processing untuk mengedit puluhan foto produk sekaligus."
      },
    ]
  },
  {
    category: 'Keamanan & Kualitas',
    items: [
      {
        question: "Apakah foto hasil ZenStudio aman dari komplain pembeli?",
        answer: "Sangat aman! Setiap foto dilengkapi Authenticity Score Report yang memastikan tingkat kemiripan fisik produk 99%+. Pelanggan akan menerima produk fisik yang persis sama dengan yang ada di foto."
      },
      {
        question: "Apakah bisa digunakan untuk ukuran Shopee, TikTok Shop, dan Instagram?",
        answer: "Ya! ZenStudio secara otomatis menyediakan Preset Ekspor Marketplace dalam rasio 1:1 (Shopee/Tokopedia), 9:16 (TikTok Shop/IG Story), dan 4:5 (Instagram Feed) tanpa memotong bagian penting produk Anda."
      },
    ]
  },
  {
    category: 'Harga & Kredit',
    items: [
      {
        question: "Bagaimana sistem kredit di ZenStudio?",
        answer: "1 kredit = 1 foto. Beli kredit sekali, pakai kapan saja — tanpa langganan bulanan. Kredit tidak kadaluarsa. Anda bisa top up ulang kapan pun dibutuhkan. Resolusi 4K dan engine Nano Banana menggunakan 2 kredit per foto."
      },
      {
        question: "Apakah ada versi gratis?",
        answer: "Ada! Anda mendapatkan 3 kredit gratis saat mendaftar tanpa perlu memasukkan kartu kredit. Anda dapat mencoba semua fitur utama sebelum memutuskan untuk membeli paket kredit."
      }
    ]
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const flatIndex = (catIdx: number, itemIdx: number) => `${catIdx}-${itemIdx}`;

  return (
    <section id="faq" className="py-16 md:py-24 bg-white border-t border-stone-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-5 mx-auto">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQ</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-stone-900 mb-4 tracking-tight">Pertanyaan Sering Diajukan</h2>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            Segala hal yang perlu Anda ketahui tentang ZenStudio.
          </p>
        </div>

        {/* FAQ by category */}
        <div className="space-y-8">
          {faqs.map((category, catIdx) => (
            <div key={catIdx}>
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3 px-1">{category.category}</h3>
              <div className="space-y-3">
                {category.items.map((faq, itemIdx) => {
                  const idx = flatIndex(catIdx, itemIdx);
                  const isOpen = openIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`border rounded-2xl overflow-hidden transition-all duration-200 bg-white ${
                        isOpen ? 'border-indigo-300 shadow-[0_4px_20px_rgba(79,70,229,0.06)]' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : idx)}
                        className="w-full p-5 sm:p-6 text-left flex justify-between items-center gap-4 hover:bg-stone-50/50 transition-colors focus:outline-none group min-h-[56px]"
                      >
                        <span className={`text-base sm:text-lg font-semibold transition-colors ${isOpen ? 'text-indigo-700' : 'text-stone-800 group-hover:text-indigo-600'}`}>
                          {faq.question}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-stone-100 text-stone-400 group-hover:bg-stone-200'
                        }`}>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-stone-600 leading-relaxed text-sm sm:text-base border-t border-stone-100 pt-4">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp CTA */}
        <div className="mt-12 text-center">
          <p className="text-stone-400 text-sm mb-3">Masih ragu? Tanya kami langsung.</p>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors text-sm"
          >
            💬 Chat via WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
