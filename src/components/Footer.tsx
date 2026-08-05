import { ZenLogo } from './ZenLogo';
import { TikTokIcon } from './MarketplaceIcons';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const VisaIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#1434CB" d="M13.535 15.894l1.4-8.694h2.24l-1.4 8.694h-2.24zm7.362-8.528c-.446-.17-.1.141-.446-.17-.78-.291-1.99-.39-3.21-.39-3.532 0-6.015 1.87-6.037 4.53-.023 1.977 1.776 3.078 3.134 3.738 1.393.676 1.861 1.11 1.854 1.716-.01.928-1.119 1.354-2.155 1.354-1.438 0-2.203-.223-3.38-.737l-.469-.224-.509 3.134c.852.39 2.427.726 4.053.74 3.82.0 6.303-1.873 6.336-4.77.022-1.593-.951-2.808-3.036-3.805-1.263-.632-2.037-1.057-2.026-1.7.01-.587.652-1.203 2.07-1.203 1.176.01 2.036.25 2.698.536l.325.147.53-3.099zm8.566-.166h-1.734c-.538 0-.943.157-1.179.718l-3.344 7.972h2.353l.469-1.297h2.875l.27 1.297h2.073l-1.783-8.69zm-2.775 5.58l1.168-3.179.673 3.179h-1.841zm-17.702-5.58l-2.207 5.925-.239-1.203c-.417-1.428-1.722-2.981-3.176-3.741l2.036 7.712h2.383l3.553-8.693h-2.35z"/>
  </svg>
);

const MastercardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="13" cy="12" r="7" fill="#EB001B"/>
    <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
    <path d="M18 6.848a6.97 6.97 0 00-2.484 5.152A6.97 6.97 0 0018 17.152a6.97 6.97 0 002.484-5.152A6.97 6.97 0 0018 6.848z" fill="#FF5F00"/>
  </svg>
);

const Footer = () => {
  return (
    <footer data-component="footer" className="bg-background pt-10 pb-8 border-t border-surface-border text-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-2">
              <ZenLogo className="h-10" />
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg bg-surface/80 border border-surface-border text-xs font-semibold text-text-muted hover:text-text hover:border-primary/30 transition-all cursor-default">
                QRIS
              </span>
              <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg bg-surface/80 border border-surface-border text-xs font-semibold text-text-muted hover:text-text hover:border-primary/30 transition-all cursor-default">
                GoPay
              </span>
              <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg bg-surface/80 border border-surface-border text-xs font-semibold text-text-muted hover:text-text hover:border-primary/30 transition-all cursor-default">
                OVO
              </span>
              <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg bg-surface/80 border border-surface-border text-xs font-semibold text-text-muted hover:text-text hover:border-primary/30 transition-all cursor-default">
                DANA
              </span>
              <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg bg-surface/80 border border-surface-border text-xs font-semibold text-text-muted hover:text-text hover:border-primary/30 transition-all cursor-default">
                Bank Transfer
              </span>
              <span className="inline-flex items-center justify-center h-7 px-2 rounded-lg bg-white border border-surface-border shadow-xs hover:border-primary/40 transition-all" title="Visa">
                <VisaIcon className="h-4 w-auto" />
              </span>
              <span className="inline-flex items-center justify-center h-7 px-2 rounded-lg bg-white border border-surface-border shadow-xs hover:border-primary/40 transition-all" title="Mastercard">
                <MastercardIcon className="h-4 w-auto" />
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
