import { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { UserButton, useAuth, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ZenLogo } from './ZenLogo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [isAuthTimeout, setIsAuthTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAuthTimeout(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const ready = isLoaded || isAuthTimeout;

  const handleOpenAuth = () => {
    try {
      if (isLoaded && typeof openSignIn === 'function') {
        openSignIn({ fallbackRedirectUrl: '/studio', signUpFallbackRedirectUrl: '/studio' });
      } else {
        // MITIGASI BACKUP: Jika script Clerk diblokir AdBlocker/CSP, langsung redirect ke portal
        window.location.href = "https://clerk.zenstudio.my.id/sign-in?redirect_url=https://zenstudio.my.id/studio";
      }
    } catch (error) {
      window.location.href = "https://clerk.zenstudio.my.id/sign-in?redirect_url=https://zenstudio.my.id/studio";
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-slate-950/85 backdrop-blur-xl border-b border-cyan-500/20 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)]' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <ZenLogo className="w-9 h-9 group-hover:scale-105 transition-transform shadow-md" />
            <span className="text-xl font-black text-white tracking-tight group-hover:text-cyan-300 transition-colors">
              ZenStudio
            </span>
          </a>
          
          {/* Desktop Nav Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1 px-4 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-inner">
              <a href="#fitur" className="px-4 py-1.5 rounded-full text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-all text-sm font-medium">
                Fitur
              </a>
              <a href="#integrity" className="px-4 py-1.5 rounded-full text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-all text-sm font-medium">
                Integrity Engine
              </a>
              <a href="#harga" className="px-4 py-1.5 rounded-full text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-all text-sm font-medium">
                Harga
              </a>
              <a href="#faq" className="px-4 py-1.5 rounded-full text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-all text-sm font-medium">
                FAQ
              </a>
            </div>
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {!ready ? (
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            ) : isSignedIn ? (
              <>
                <Link to="/studio" className="text-slate-300 hover:text-cyan-300 font-semibold text-sm transition-colors">
                  Studio
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <button 
                  onClick={handleOpenAuth}
                  className="text-slate-300 hover:text-cyan-300 font-semibold text-sm transition-colors px-3 py-1.5"
                >
                  Masuk
                </button>
                <button 
                  onClick={handleOpenAuth}
                  className="bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 flex items-center gap-2 border border-cyan-400/30"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                  Coba Gratis
                </button>
              </>
            )}
          </div>
          
          {/* Mobile Toggle Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-slate-900 border border-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6 text-cyan-400" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-cyan-500/20 backdrop-blur-2xl shadow-2xl">
          <div className="px-4 pt-3 pb-6 space-y-2">
            <a 
              href="#fitur" 
              onClick={() => setIsOpen(false)} 
              className="block px-4 py-2.5 rounded-xl text-base font-medium text-slate-200 hover:text-cyan-300 hover:bg-slate-900"
            >
              Fitur
            </a>
            <a 
              href="#integrity" 
              onClick={() => setIsOpen(false)} 
              className="block px-4 py-2.5 rounded-xl text-base font-medium text-slate-200 hover:text-cyan-300 hover:bg-slate-900"
            >
              Integrity Engine
            </a>
            <a 
              href="#harga" 
              onClick={() => setIsOpen(false)} 
              className="block px-4 py-2.5 rounded-xl text-base font-medium text-slate-200 hover:text-cyan-300 hover:bg-slate-900"
            >
              Harga
            </a>
            <a 
              href="#faq" 
              onClick={() => setIsOpen(false)} 
              className="block px-4 py-2.5 rounded-xl text-base font-medium text-slate-200 hover:text-cyan-300 hover:bg-slate-900"
            >
              FAQ
            </a>
            
            {!ready ? (
              <div className="pt-4 flex justify-center items-center py-4 border-t border-slate-800/80">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : isSignedIn ? (
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <Link 
                  to="/studio" 
                  onClick={() => setIsOpen(false)} 
                  className="w-full bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 text-white px-4 py-3 rounded-xl text-base font-bold flex items-center gap-2 justify-center shadow-lg shadow-cyan-500/20"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  Masuk Studio
                </Link>
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-sm font-medium text-slate-300">Profil & Akun</span>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    handleOpenAuth();
                  }} 
                  className="w-full text-left block px-4 py-2.5 rounded-xl text-base font-medium text-slate-200 hover:text-cyan-300 hover:bg-slate-900"
                >
                  Masuk
                </button>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    handleOpenAuth();
                  }} 
                  className="w-full bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 text-white px-4 py-3 rounded-xl text-base font-bold flex items-center gap-2 justify-center shadow-lg shadow-cyan-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Coba Gratis
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

