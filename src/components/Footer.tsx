import { ZenLogo } from './ZenLogo';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-background pt-16 pb-8 border-t border-surface-border text-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <ZenLogo className="w-8 h-8" />
              <span className="font-sans text-xl font-bold text-text tracking-tight">ZenStudio</span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed mb-5 max-w-xs">
              Tingkatkan konversi dengan foto produk kelas dunia dalam hitungan detik. Tanpa studio, tanpa fotografer.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-muted hover:text-primary hover:border-primary border border-surface-border transition-all" aria-label="Instagram">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-muted hover:text-primary hover:border-primary border border-surface-border transition-all" aria-label="TikTok">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 6.5a4.5 4.5 0 01-3-1.5v6a5 5 0 11-4-4.8v2.4a2.5 2.5 0 102 2.4V2h2.5c.5 1.5 1.5 3 2.5 4.5z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-muted hover:text-primary hover:border-primary border border-surface-border transition-all" aria-label="WhatsApp">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>

          {/* Produk */}
          <div>
            <h3 className="font-sans font-bold text-text mb-4">Produk</h3>
            <ul className="space-y-3">
              <li><a href="#fitur" className="text-text-muted hover:text-primary text-sm transition-colors">AI Studio</a></li>
              <li><a href="#integrity" className="text-text-muted hover:text-primary text-sm transition-colors">Integrity Engine™</a></li>
              <li><a href="#fitur" className="text-text-muted hover:text-primary text-sm transition-colors">Marketplace Presets</a></li>
              <li><a href="#harga" className="text-text-muted hover:text-primary text-sm transition-colors">Harga</a></li>
            </ul>
          </div>

          {/* Perusahaan */}
          <div>
            <h3 className="font-sans font-bold text-text mb-4">Perusahaan</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-text-muted hover:text-primary text-sm transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="text-text-muted hover:text-primary text-sm transition-colors">Kontak</a></li>
              <li><a href="mailto:hello@zenstudio.my.id" className="text-text-muted hover:text-primary text-sm transition-colors">hello@zenstudio.my.id</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-sans font-bold text-text mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-text-muted hover:text-primary text-sm transition-colors">Syarat & Ketentuan</a></li>
              <li><a href="#" className="text-text-muted hover:text-primary text-sm transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-surface-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-text-muted text-sm">
            © {new Date().getFullYear()} ZenStudio. Dibuat untuk UMKM Indonesia.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(61,139,125,0.4)]"></span>
            <span className="text-text-muted text-xs">Server aktif 99.9%</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
