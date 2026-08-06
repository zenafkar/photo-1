import { ZenLogo } from './ZenLogo';
import { handleSmoothScroll } from '../utils/smoothScroll';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer data-component="footer" className="bg-landing-bg pt-8 pb-10 border-t border-landing-border text-landing-text">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Main Grid: Blueprint layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-20 border-b border-landing-border pb-20">
          
          {/* Brand & Telemetry (Left) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="mb-4 opacity-80">
                <ZenLogo className="h-20" />
              </div>
              <p className="text-sm font-light text-landing-text-muted max-w-sm leading-relaxed mb-8">
                Tingkatkan konversi dengan resolusi foto produk kelas dunia dalam hitungan detik. Presisi tingkat piksel. Tanpa kompromi.
              </p>
            </div>
            
            {/* Telemetry Block */}
            <div className="border border-landing-border p-4 bg-landing-surface/20 w-fit">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-landing-secondary animate-pulse" />
                <span className="text-[9px] font-mono tracking-widest text-landing-text uppercase">System Status</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-mono text-landing-text-muted">
                <span>NODE: ASIA-SE</span>
                <span className="flex items-center gap-1">ENGINE: GOOGLE & OPENAI <CheckCircle2 className="w-2.5 h-2.5 text-landing-secondary" /></span>
                <span>LATENCY: 12ms</span>
                <span>UPTIME: 99.98%</span>
              </div>
            </div>
          </div>

          {/* Links Grid (Right) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12 lg:pl-12">
            
            {/* Architecture (Produk) */}
            <div>
              <h3 className="font-mono text-[10px] tracking-widest text-landing-text-muted uppercase border-b border-landing-border pb-3 mb-4">Architecture</h3>
              <ul className="space-y-4">
                <li><a href="#fitur" onClick={(e) => handleSmoothScroll(e, '#fitur')} className="text-xs font-light text-landing-text hover:text-landing-primary transition-colors flex items-center justify-between group">AI Studio <span className="opacity-0 group-hover:opacity-100 transition-opacity">/</span></a></li>
                <li><a href="#integrity" onClick={(e) => handleSmoothScroll(e, '#integrity')} className="text-xs font-light text-landing-text hover:text-landing-primary transition-colors flex items-center justify-between group">Integrity Engine™ <span className="opacity-0 group-hover:opacity-100 transition-opacity">/</span></a></li>
                <li><a href="#harga" onClick={(e) => handleSmoothScroll(e, '#harga')} className="text-text-xs font-light text-landing-text hover:text-landing-primary transition-colors flex items-center justify-between group">Rate Card <span className="opacity-0 group-hover:opacity-100 transition-opacity">/</span></a></li>
              </ul>
            </div>

            {/* Entity (Perusahaan) */}
            <div>
              <h3 className="font-mono text-[10px] tracking-widest text-landing-text-muted uppercase border-b border-landing-border pb-3 mb-4">Entity</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-xs font-light text-landing-text hover:text-landing-primary transition-colors flex items-center justify-between group">About Us <span className="opacity-0 group-hover:opacity-100 transition-opacity">/</span></a></li>
                <li><a href="mailto:hello@zenstudio.my.id" className="text-xs font-light text-landing-text hover:text-landing-primary transition-colors flex items-center justify-between group">hello@zenstudio.my.id <span className="opacity-0 group-hover:opacity-100 transition-opacity">/</span></a></li>
              </ul>
            </div>

            {/* Protocol (Legal) */}
            <div>
              <h3 className="font-mono text-[10px] tracking-widest text-landing-text-muted uppercase border-b border-landing-border pb-3 mb-4">Protocol</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-xs font-light text-landing-text hover:text-landing-primary transition-colors flex items-center justify-between group">Terms of Service <span className="opacity-0 group-hover:opacity-100 transition-opacity">/</span></a></li>
                <li><a href="#" className="text-xs font-light text-landing-text hover:text-landing-primary transition-colors flex items-center justify-between group">Privacy Policy <span className="opacity-0 group-hover:opacity-100 transition-opacity">/</span></a></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-mono tracking-widest text-landing-text-muted uppercase">
            © {new Date().getFullYear()} ZenStudio. Dibuat di Indonesia.
          </p>
          
          {/* Social Links (Stark Text) */}
          <div className="flex items-center gap-6">
            <a href="#" className="flex items-center gap-1 text-[10px] font-mono tracking-widest text-landing-text hover:text-landing-primary transition-colors uppercase">
              Instagram <ArrowUpRight className="w-3 h-3" />
            </a>
            <a href="#" className="flex items-center gap-1 text-[10px] font-mono tracking-widest text-landing-text hover:text-landing-primary transition-colors uppercase">
              TikTok <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
