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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
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
            <div className="flex flex-wrap gap-2.5">
              <img src="https://midtrans-website.al-mp-id-p.cdn.gtflabs.io/uploads/2024/10/b737877a71b67787615112f4854b30b6_e2190f206776feffdd640a8cc617a45e_compressed.png" alt="Payment Method" className="h-6 w-auto object-contain bg-white rounded px-1.5 py-1" />
              <img src="https://midtrans-website.al-mp-id-p.cdn.gtflabs.io/uploads/2020/10/f7fb2e0ab8572355142dba33ddc7b8d6_0747205be87147c03d04217ad4eb06c3_compressed.png" alt="Payment Method" className="h-6 w-auto object-contain bg-white rounded px-1.5 py-1" />
              <img src="https://midtrans-website.al-mp-id-p.cdn.gtflabs.io/uploads/2021/03/5db129dbf7357fd4b59fe9fbbf883f74_e82f1494c766508e8bb827c564ccf373_compressed.png" alt="Payment Method" className="h-6 w-auto object-contain bg-white rounded px-1.5 py-1" />
              <img src="https://midtrans-website.al-mp-id-p.cdn.gtflabs.io/uploads/2020/09/080278a8b6c1dea174b9109fa539355e_2af5ca82c1d8c4b76219600643ff509a_compressed.png" alt="Payment Method" className="h-6 w-auto object-contain bg-white rounded px-1.5 py-1" />
              <img src="https://midtrans-website.al-mp-id-p.cdn.gtflabs.io/uploads/2020/09/b2bbf094c458f87f3f2da2a586e7900f_02a27aedf91f8278ededd199d03fb89b_compressed.png" alt="Payment Method" className="h-6 w-auto object-contain bg-white rounded px-1.5 py-1" />
              <img src="https://midtrans-website.al-mp-id-p.cdn.gtflabs.io/uploads/2021/02/bc8804c570a21f444ff665c5e8882b06_be31feee12a5fd37e039cd951d664959_compressed.png" alt="Payment Method" className="h-6 w-auto object-contain bg-white rounded px-1.5 py-1" />
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
