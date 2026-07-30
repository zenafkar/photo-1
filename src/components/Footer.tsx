import { Camera } from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-white pt-24 pb-12 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Prodify</span>
            </div>
            <p className="text-slate-500 mb-6 text-sm">
              Tingkatkan konversi dengan foto produk kelas dunia dalam hitungan detik. Tanpa studio, tanpa fotografer.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <TwitterIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Produk</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">AI Studio</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Integrity Engine™</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Marketplace Presets</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Harga</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Perusahaan</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Blog</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Karier</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Kontak</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Syarat & Ketentuan</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Kebijakan Privasi</a></li>
              <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Panduan Komunitas</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Prodify Inc. Hak cipta dilindungi undang-undang.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500">Sistem Berjalan Normal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
