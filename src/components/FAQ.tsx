import { useState, useRef, useEffect } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';

const faqs = [
  {
    category: 'System Capabilities',
    items: [
      {
        question: "Apa bedanya ZenStudio dengan AI Image Generator biasa?",
        answer: "AI generator umum meregenerasi seluruh piksel gambar, sehingga merusak bentuk, logo, atau detail label asli produk. ZenStudio menggunakan Product Integrity Engine™ yang mengunci 100% bentuk, warna, dan tulisan asli produk. Kami hanya merekayasa ulang latar belakang, pantulan cahaya, dan bayangan studio secara realistis."
      },
      {
        question: "Berapa lama proses pembuatan foto produk di ZenStudio?",
        answer: "Engine kami membutuhkan waktu rata-rata 15–30 detik per operasi render. Anda juga dapat menggunakan fitur Batch Processing untuk mengantrekan dan mengeksekusi puluhan render foto sekaligus secara asinkron."
      },
    ]
  },
  {
    category: 'Output Integrity',
    items: [
      {
        question: "Apakah hasil render aman dari keluhan (komplain) pelanggan?",
        answer: "Sangat aman. Setiap aset yang dirender dilengkapi Authenticity Score Report yang menjamin kemiripan fisik produk 99%+. Algoritma kami memastikan tidak ada pembengkokan geometri atau manipulasi warna produk."
      },
      {
        question: "Apakah mendukung rasio standar e-commerce & media sosial?",
        answer: "Ya. Sistem menyediakan Preset Crop Otomatis: rasio 1:1 (Shopee/Tokopedia/Katalog), rasio 9:16 (TikTok Shop/IG Reels), dan rasio 4:5 (Instagram Feed). Objek utama secara otomatis dipertahankan di pusat bingkai."
      },
    ]
  },
  {
    category: 'Billing & Credits',
    items: [
      {
        question: "Bagaimana sistem kredit (billing) di ZenStudio?",
         answer: "ZenStudio beroperasi dengan model pay-as-you-go. 1 kredit = 1 eksekusi render foto. Kredit Anda tidak memiliki masa berlaku (no expiry) dan tidak ada sistem langganan (subscription) tersembunyi. Biaya render bergantung pada AI Engine dan resolusi; Nano Banana Pro pada mode Ultra 4K menggunakan 3 kredit."
      },
      {
        question: "Apakah tersedia alokasi trial gratis?",
        answer: "Tersedia. Akun baru yang diregistrasikan akan menerima alokasi 3 kredit awal tanpa memerlukan autentikasi kartu kredit. Anda dapat menguji seluruh fungsi inti mesin render sebelum melakukan pembelian."
      }
    ]
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Simple scroll spy for desktop
  useEffect(() => {
    const handleScroll = () => {
      const offsets = categoryRefs.current.map(ref => {
        if (!ref) return Infinity;
        const rect = ref.getBoundingClientRect();
        return rect.top;
      });
      
      // Find the category closest to the top of the viewport (with an offset)
      const threshold = 150;
      let currentActive = 0;
      for (let i = offsets.length - 1; i >= 0; i--) {
        if (offsets[i] <= threshold) {
          currentActive = i;
          break;
        }
      }
      setActiveCategory(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCategory = (index: number) => {
    setActiveCategory(index);
    const ref = categoryRefs.current[index];
    if (ref) {
      const yOffset = -100; // Account for any fixed header if exists
      const y = ref.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const flatIndex = (catIdx: number, itemIdx: number) => `${catIdx}-${itemIdx}`;

  return (
    <section data-component="faq" id="faq" className="py-24 lg:py-32 bg-landing-bg border-t border-landing-border text-landing-text relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-landing-surface/50 border border-landing-border mb-6">
            <HelpCircle className="w-3.5 h-3.5 text-landing-text-muted" />
            <span className="text-[10px] uppercase tracking-widest font-mono text-landing-text-muted">Knowledge Base</span>
          </div>
          <h2 className="font-landing-display text-4xl lg:text-5xl font-light text-landing-text mb-4 tracking-tight max-w-2xl">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Split-screen Layout */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 relative">
          
          {/* Left: Sticky Categories (Desktop) */}
          <div className="hidden lg:block w-1/4 shrink-0">
            <div className="sticky top-24">
              <div className="text-[10px] font-mono tracking-widest text-landing-text-muted mb-6 uppercase border-b border-landing-border pb-4">Index</div>
              <ul className="space-y-4">
                {faqs.map((cat, idx) => (
                  <li key={idx}>
                    <button 
                      onClick={() => scrollToCategory(idx)}
                      className={`text-left text-sm font-mono tracking-wide uppercase transition-all duration-300 w-full ${
                        activeCategory === idx 
                          ? 'text-landing-primary pl-4 border-l-2 border-landing-primary' 
                          : 'text-landing-text-muted hover:text-landing-text border-l-2 border-transparent'
                      }`}
                    >
                      0{idx + 1}. {cat.category}
                    </button>
                  </li>
                ))}
              </ul>
              
              <div className="mt-16 pt-8 border-t border-landing-border">
                <div className="text-[10px] font-mono tracking-widest text-landing-text-muted mb-4 uppercase">Support Contact</div>
                <a href="mailto:hello@zenstudio.my.id" className="text-sm font-light hover:text-landing-primary transition-colors flex items-center gap-2">
                  hello@zenstudio.my.id <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Right: The Questions */}
          <div className="flex-1 w-full">
            <div className="space-y-16">
              {faqs.map((category, catIdx) => (
                <div 
                  key={catIdx} 
                  ref={el => { categoryRefs.current[catIdx] = el; }}
                  className="scroll-mt-24"
                >
                  <h3 className="lg:hidden text-xs font-mono font-bold text-landing-primary uppercase tracking-widest mb-6 border-b border-landing-border pb-2">
                    0{catIdx + 1}. {category.category}
                  </h3>
                  
                  <div className="border-t border-landing-border">
                    {category.items.map((faq, itemIdx) => {
                      const idx = flatIndex(catIdx, itemIdx);
                      const isOpen = openIndex === idx;
                      const triggerId = `faq-trigger-${idx}`;
                      const panelId = `faq-panel-${idx}`;

                      return (
                        <div
                          key={idx}
                          className="border-b border-landing-border overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                            className="w-full py-6 text-left flex justify-between items-start gap-6 group focus:outline-none"
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            id={triggerId}
                          >
                            <span className={`font-landing-display text-xl sm:text-2xl font-light leading-snug transition-colors ${isOpen ? 'text-landing-primary' : 'text-landing-text group-hover:text-landing-text/70'}`}>
                              {faq.question}
                            </span>
                            <div className="mt-1 flex items-center justify-center shrink-0 text-landing-text-muted transition-transform duration-300">
                              <span className="text-xs font-mono font-bold tracking-wider">
                                {isOpen ? '[-]' : '[+]'}
                              </span>
                            </div>
                          </button>
                          
                          <div
                            role="region"
                            id={panelId}
                            aria-labelledby={triggerId}
                            className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-8' : 'grid-rows-[0fr] opacity-0 pb-0'}`}
                          >
                            <div className="overflow-hidden">
                              <p className="text-landing-text-muted font-light leading-relaxed max-w-3xl pr-4">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Contact */}
            <div className="mt-16 pt-8 border-t border-landing-border block lg:hidden">
                <div className="text-[10px] font-mono tracking-widest text-landing-text-muted mb-4 uppercase">Support Contact</div>
                <a href="mailto:hello@zenstudio.my.id" className="text-sm font-light hover:text-landing-primary transition-colors flex items-center gap-2">
                  hello@zenstudio.my.id <ArrowRight className="w-3 h-3" />
                </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default FAQ;
