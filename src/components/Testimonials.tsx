import { Star, MessageSquareQuote } from 'lucide-react';

const testimonials = [
  {
    name: "Budi Santoso",
    role: "Top Seller Shopee Makanan",
    content: "Dulu pusing mikirin biaya studio karena produk sambal kami banyak variannya. Pakai AI biasa labelnya sering berubah tulisan. Prodify gila sih, label 100% utuh, backgroundnya jadi kayak di cafe beneran. Konversi naik 45%!",
    avatar: "BS"
  },
  {
    name: "Siti Amelia",
    role: "Owner Skincare Lokal",
    content: "Buat produk kosmetik, warna botol dan tekstur itu krusial. Prodify satu-satunya AI yang ngerti ini. Product Integrity Score nya ngasih jaminan pelanggan gak akan komplain beda barang pas sampai.",
    avatar: "SA"
  },
  {
    name: "Deny Pratama",
    role: "TikTok Shop Fashion",
    content: "Export otomatis ke ukuran IG Story dan TikTok gokil banget. Sehari bisa ngedit 50 foto produk cuma sambil tiduran pakai HP. Worth it banget upgrade ke Premium.",
    avatar: "DP"
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 bg-slate-950 border-t border-slate-800/80 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(8,145,178,0.1)_0%,transparent_70%)] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-xs font-mono text-cyan-300 mb-6 backdrop-blur-md">
            <MessageSquareQuote className="w-3.5 h-3.5 text-cyan-400" />
            <span>SUCCESS STORIES</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Dipercaya 10,000+ UMKM Indonesia</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-[32px] p-8 flex flex-col h-full hover:-translate-y-2 hover:border-cyan-500/50 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] group">
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                ))}
              </div>
              <p className="text-slate-300 mb-8 flex-grow leading-relaxed font-medium group-hover:text-cyan-50 transition-colors">"{t.content}"</p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/30">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-slate-100 font-bold group-hover:text-cyan-300 transition-colors">{t.name}</h4>
                  <span className="text-sm font-semibold text-cyan-500/80">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
