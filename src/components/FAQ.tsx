import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

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
    answer: "Ada! Anda mendapatkan 10 foto gratis setiap bulan tanpa perlu memasukkan kartu kredit. Anda dapat mencoba semua fitur utama sebelum memutuskan untuk berlangganan."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-white border border-gray-200 rounded-2xl mb-6 shadow-sm">
            <HelpCircle className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Pertanyaan Sering Diajukan (FAQ)</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Segala hal yang perlu Anda ketahui tentang Prodify dan teknologi Product Integrity Engine™.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 bg-white"
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors focus:outline-none"
                >
                  <span className="text-lg font-bold text-slate-900">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-slate-600 leading-relaxed font-medium border-t border-gray-100 pt-4">
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
