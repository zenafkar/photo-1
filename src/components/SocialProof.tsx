import { Star, ShieldCheck, Fingerprint, Activity, Award } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

const testimonials = [
  {
    name: "Budi Santoso",
    role: "Top Seller Shopee Makanan",
    content: "Dulu pusing mikirin biaya studio karena produk sambal kami banyak variannya. Pakai AI biasa labelnya sering berubah tulisan. ZenStudio gila sih, label 100% utuh, backgroundnya jadi kayak di cafe beneran. Konversi naik 45%!",
    avatar: "BS"
  },
  {
    name: "Siti Amelia",
    role: "Owner Skincare Lokal",
    content: "Buat produk kosmetik, warna botol dan tekstur itu krusial. ZenStudio satu-satunya AI yang ngerti ini. Product Integrity Score nya ngasih jaminan pelanggan gak akan komplain beda barang pas sampai.",
    avatar: "SA"
  },
  {
    name: "Deny Pratama",
    role: "TikTok Shop Fashion",
    content: "Export otomatis ke ukuran IG Story dan TikTok gokil banget. Sehari bisa ngedit 50 foto produk cuma sambil tiduran pakai HP. Worth it banget upgrade ke Premium.",
    avatar: "DP"
  },
  {
    name: "Rina Wijaya",
    role: "Seller Tokopedia Fashion",
    content: "Awalnya ragu karena udah coba banyak AI generator yang hasilnya aneh. Ternyata ZenStudio beda — detail payet di baju tetap keliatan jelas, gak luntur kayak AI lain. Sekarang semua foto produk pakai ini.",
    avatar: "RW"
  },
  {
    name: "Agus Hartono",
    role: "UMKM Elektronik & Gadget",
    content: "Yang paling saya suka itu fitur Smart Prompt-nya. Gak perlu pusing mikirin kata-kata bahasa Inggris, tinggal pilih preset langsung jadi. Hasilnya mirip foto studio profesional beneran. Hemat jutaan rupiah!",
    avatar: "AH"
  }
];

const trustBadges = [
  { icon: ShieldCheck, label: "Produk 100% Asli", desc: "Bentuk & warna terjaga" },
  { icon: Fingerprint, label: "OCR & Label Safe", desc: "Teks logo tidak berubah" },
  { icon: Activity, label: "Authenticity Score", desc: "Verifikasi 99%+ akurat" },
];

const SocialProof = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeDot, setActiveDot] = useState(0);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    // Track which card is most visible
    const cardWidth = el.clientWidth * 0.85; // approximate card width on mobile
    const idx = Math.round(el.scrollLeft / (cardWidth + 16)); // 16px gap
    setActiveDot(Math.min(idx, testimonials.length - 1));
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <section className="py-16 md:py-24 bg-background border-t border-surface-border relative overflow-hidden text-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-surface-border text-xs font-semibold text-primary mb-5 mx-auto">
            <Award className="w-3.5 h-3.5" />
            <span>DIPERCAYA 10.000+ UMKM</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-text mb-4 tracking-tight">
            Kenapa UMKM Pilih ZenStudio?
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Bukan cuma AI generator biasa — ZenStudio{" "}
            <strong className="text-text font-semibold">satu-satunya</strong> yang menjamin produk Anda tetap 100% asli.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-14 md:mb-20">
          {trustBadges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-surface/40 border border-surface-border hover:border-primary/30 transition-colors">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text">{badge.label}</div>
                  <div className="text-xs text-text-muted">{badge.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Star Rating Summary */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 mb-2">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className="w-6 h-6 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="text-lg font-bold text-text">4.9 dari 5</div>
          <div className="text-sm text-text-muted">Berdasarkan 500+ ulasan pengguna</div>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* Scroll buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-surface border border-surface-border shadow-md flex items-center justify-center text-text-muted hover:text-primary transition-colors hidden md:flex"
              aria-label="Scroll kiri"
            >
              ←
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-surface border border-surface-border shadow-md flex items-center justify-center text-text-muted hover:text-primary transition-colors hidden md:flex"
              aria-label="Scroll kanan"
            >
              →
            </button>
          )}

          {/* Cards */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-4 -mx-4 px-4 scrollbar-none scroll-smooth"
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-[85vw] max-w-[380px] md:w-[350px] bg-surface/40 border border-surface-border rounded-2xl p-6 flex flex-col hover:border-primary/30 transition-all"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-sm text-text-muted mb-6 flex-grow leading-relaxed">"{t.content}"</p>
                {/* Author */}
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-text">{t.name}</div>
                    <div className="text-xs text-text-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots indicator (mobile) */}
          <div className="flex justify-center gap-1.5 mt-4 md:hidden">
            {testimonials.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === activeDot ? 'bg-primary' : 'bg-surface-border'}`} />
            ))}
          </div>
        </div>

        {/* Stats Banner — warm gradient */}
        <div className="mt-14 md:mt-20 bg-gradient-to-r from-primary to-primary-dark rounded-3xl p-6 sm:p-10 text-center text-white max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1 font-display">10K+</div>
              <div className="text-white/70 text-sm">UMKM Pengguna</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1 font-display">50K+</div>
              <div className="text-white/70 text-sm">Foto Digenerate</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1 font-display">99.8%</div>
              <div className="text-white/70 text-sm">Akurasi Produk</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1 font-display">30dtk</div>
              <div className="text-white/70 text-sm">Rata-rata Proses</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
