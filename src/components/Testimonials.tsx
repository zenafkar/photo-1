import { Star } from 'lucide-react';

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
    <section className="py-12 md:py-16 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-16 text-center">Dipercaya 10,000+ UMKM Indonesia</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[32px] p-8 flex flex-col h-full hover:-translate-y-2 transition-transform shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 mb-8 flex-grow leading-relaxed font-medium">"{t.content}"</p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-sm">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold">{t.name}</h4>
                  <span className="text-sm font-semibold text-indigo-500">{t.role}</span>
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
