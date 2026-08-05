import { ZenLogo } from './ZenLogo';
import { TikTokIcon } from './MarketplaceIcons';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const Footer = () => {
  return (
    <footer data-component="footer" className="bg-background pt-16 pb-8 border-t border-surface-border text-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
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
              <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-muted hover:text-primary hover:border-primary border border-surface-border transition-all cursor-default" aria-label="Instagram">
                <InstagramIcon className="w-5 h-5" />
              </span>
              <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-muted hover:text-primary hover:border-primary border border-surface-border transition-all cursor-default" aria-label="TikTok">
                <TikTokIcon className="w-5 h-5" />
              </span>
              <a href="mailto:hello@zenstudio.my.id" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-muted hover:text-primary hover:border-primary border border-surface-border transition-all" aria-label="Email">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
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

          {/* Pembayaran */}
          <div>
            <h3 className="font-sans font-bold text-text mb-4">Pembayaran</h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs font-medium text-text-muted">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                QRIS
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs font-medium text-text-muted">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                GoPay
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs font-medium text-text-muted">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                OVO
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs font-medium text-text-muted">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                DANA
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs font-medium text-text-muted">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                Visa
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs font-medium text-text-muted">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                Mastercard
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-xs font-medium text-text-muted">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                Transfer Bank
              </span>
            </div>
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
