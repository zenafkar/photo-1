import { ArrowRight, Image as ImageIcon, Zap, ShieldCheck } from 'lucide-react';
import { StaggerContainer, StaggerItem } from './ScrollReveal';
import { SignInButton, SignedOut, SignedIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-white isolate">
      {/* Premium Abstract Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2560" 
          alt="Abstract Background" 
          className="w-full h-full object-cover opacity-[0.25] scale-105"
        />
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <StaggerContainer>
          <StaggerItem>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-gray-100 text-sm font-semibold text-indigo-600 mb-8 shadow-sm">
              <SparklesIcon className="w-4 h-4 text-indigo-500" />
              <span>Product Integrity Guarantee™ — AI yang menjaga keaslian produk Anda</span>
            </div>
          </StaggerItem>
          
          <StaggerItem>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
              Foto Produk Profesional.<br />
              <span className="text-gradient-animated">Produk Tetap Asli.</span>
            </h1>
          </StaggerItem>
          
          <StaggerItem>
            <p className="mt-6 text-xl text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              Tingkatkan konversi penjualan Shopee, TikTok Shop, dan Instagram dengan kualitas studio. AI kami mempercantik foto tanpa mengubah bentuk, warna, atau logo asli produk Anda.
            </p>
          </StaggerItem>
          
          <StaggerItem>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_25px_rgba(15,23,42,0.2)] hover:-translate-y-0.5">
                    Mulai Gratis (3 Foto/Bulan)
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/studio" className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_25px_rgba(15,23,42,0.2)] hover:-translate-y-0.5">
                  Masuk Prodify Studio
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </SignedIn>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-16 flex flex-wrap justify-center gap-8 text-slate-500 text-sm font-semibold">
              <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-500" /> Tidak mengubah logo</div>
              <div className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-indigo-500" /> Resolusi 4K High-Res</div>
              <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-500" /> Selesai dalam 30 detik</div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </div>
  );
};

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
)

export default Hero;
