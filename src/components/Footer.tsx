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
import { ZenLogo } from './ZenLogo';

const Footer = () => {
  return (
    <footer className="bg-slate-950 pt-24 pb-12 border-t border-slate-800 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent shadow-[0_-10px_20px_rgba(6,182,212,0.5)]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400 rounded-xl blur-md opacity-50" />
                <ZenLogo className="w-9 h-9 relative z-10" />
              </div>
              <span className="text-xl font-bold text-slate-100 tracking-tight">ZenStudio</span>
            </div>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              Tingkatkan konversi dengan foto produk kelas dunia dalam hitungan detik. Tanpa studio, tanpa fotografer.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 border border-slate-800 transition-all duration-300">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 border border-slate-800 transition-all duration-300">
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 border border-slate-800 transition-all duration-300">
                <TwitterIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-100 mb-4 tracking-wide">Produk</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">AI Studio</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Integrity Engine™</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Marketplace Presets</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Harga</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-100 mb-4 tracking-wide">Perusahaan</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Tentang Kami</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Karier</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Kontak</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-100 mb-4 tracking-wide">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Syarat & Ketentuan</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Kebijakan Privasi</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Panduan Komunitas</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} ZenStudio. Hak cipta dilindungi undang-undang.
          </p>
          <div className="flex items-center gap-2 text-sm bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
            <span className="text-slate-400 font-mono text-xs">SYSTEM ACTIVE: 100% SECURE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
