import { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { UserButton, useAuth, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ZenLogo } from './ZenLogo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn, openSignUp } = useClerk();
  const [isAuthTimeout, setIsAuthTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAuthTimeout(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const ready = isLoaded || isAuthTimeout;

  const handleOpenSignIn = () => {
    try {
      if (typeof openSignIn === 'function') {
        openSignIn({ fallbackRedirectUrl: '/studio', signUpFallbackRedirectUrl: '/studio' });
      }
    } catch (error) {
      console.error("Error opening sign-in modal:", error);
    }
  };

  const handleOpenSignUp = () => {
    try {
      if (typeof openSignUp === 'function') {
        openSignUp({ fallbackRedirectUrl: '/studio', signInFallbackRedirectUrl: '/studio' });
      } else if (typeof openSignIn === 'function') {
        openSignIn({ fallbackRedirectUrl: '/studio', signUpFallbackRedirectUrl: '/studio' });
      }
    } catch (error) {
      console.error("Error opening sign-up modal:", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-lg border-b border-stone-200/80 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
          : 'bg-transparent py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 lg:h-14">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <ZenLogo className="w-8 h-8 sm:w-9 sm:h-9 group-hover:scale-105 transition-transform" />
            <span className={`text-lg sm:text-xl font-extrabold tracking-tight transition-colors ${isScrolled ? 'text-stone-900' : 'text-stone-900'}`}>
              ZenStudio
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-stone-100/80 border border-stone-200/60">
              <a href="#cara-kerja" className="px-4 py-1.5 rounded-full text-stone-600 hover:text-indigo-600 hover:bg-white transition-all text-sm font-medium">
                Cara Kerja
              </a>
              <a href="#fitur" className="px-4 py-1.5 rounded-full text-stone-600 hover:text-indigo-600 hover:bg-white transition-all text-sm font-medium">
                Fitur
              </a>
              <a href="#harga" className="px-4 py-1.5 rounded-full text-stone-600 hover:text-indigo-600 hover:bg-white transition-all text-sm font-medium">
                Harga
              </a>
              <a href="#faq" className="px-4 py-1.5 rounded-full text-stone-600 hover:text-indigo-600 hover:bg-white transition-all text-sm font-medium">
                FAQ
              </a>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {!ready ? (
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            ) : isSignedIn ? (
              <>
                <Link to="/studio" className="text-stone-600 hover:text-indigo-600 font-semibold text-sm transition-colors">
                  Studio
                </Link>
                <UserButton afterSignOutUrl="/">
                  <UserButton.MenuItems>
                    <UserButton.Link label="Studio Dashboard" labelIcon={<Sparkles size={15} />} href="/studio" />
                    <UserButton.Action label="manageAccount" />
                    <UserButton.Action label="signOut" />
                  </UserButton.MenuItems>
                </UserButton>
              </>
            ) : (
              <>
                <button
                  onClick={handleOpenSignIn}
                  className="text-stone-600 hover:text-indigo-600 font-semibold text-sm transition-colors px-3 py-2"
                >
                  Masuk
                </button>
                <button
                  onClick={handleOpenSignUp}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_2px_10px_rgba(79,70,229,0.25)] hover:shadow-[0_4px_15px_rgba(79,70,229,0.35)] hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  Coba Gratis
                </button>
              </>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {!ready ? null : !isSignedIn ? (
              <button
                onClick={handleOpenSignUp}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                3 Foto Gratis
              </button>
            ) : null}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-stone-600 hover:text-indigo-600 hover:bg-stone-100 border border-stone-200 focus:outline-none min-w-[40px] min-h-[40px]"
              aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Full-Screen Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-[56px] z-40 bg-white lg:hidden overflow-y-auto">
          <div className="px-4 pt-6 pb-8 space-y-1">
            <a
              href="#cara-kerja"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-4 rounded-xl text-base font-semibold text-stone-800 hover:text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[52px]"
            >
              🚀 Cara Kerja
            </a>
            <a
              href="#fitur"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-4 rounded-xl text-base font-semibold text-stone-800 hover:text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[52px]"
            >
              ✨ Fitur
            </a>
            <a
              href="#integrity"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-4 rounded-xl text-base font-semibold text-stone-800 hover:text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[52px]"
            >
              🛡️ Integrity Engine
            </a>
            <a
              href="#harga"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-4 rounded-xl text-base font-semibold text-stone-800 hover:text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[52px]"
            >
              💰 Harga
            </a>
            <a
              href="#faq"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-4 rounded-xl text-base font-semibold text-stone-800 hover:text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[52px]"
            >
              ❓ FAQ
            </a>

            {/* Mobile Auth Section */}
            <div className="pt-6 mt-4 border-t border-stone-200 space-y-3">
              {!ready ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : isSignedIn ? (
                <div className="space-y-3">
                  <Link
                    to="/studio"
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-4 rounded-xl text-base font-bold flex items-center gap-2 justify-center shadow-[0_4px_15px_rgba(79,70,229,0.25)] min-h-[52px]"
                  >
                    <Sparkles className="w-5 h-5 text-indigo-200" />
                    Masuk Studio
                  </Link>
                  <div className="flex items-center justify-between px-4 py-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-sm font-medium text-stone-700">Profil & Akun</span>
                    <UserButton afterSignOutUrl="/">
                      <UserButton.MenuItems>
                        <UserButton.Link label="Studio Dashboard" labelIcon={<Sparkles size={15} />} href="/studio" />
                        <UserButton.Action label="manageAccount" />
                        <UserButton.Action label="signOut" />
                      </UserButton.MenuItems>
                    </UserButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => { setIsOpen(false); handleOpenSignIn(); }}
                    className="w-full px-4 py-4 rounded-xl text-base font-semibold text-stone-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors text-left min-h-[52px]"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); handleOpenSignUp(); }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-4 rounded-xl text-base font-bold flex items-center gap-2 justify-center shadow-[0_4px_15px_rgba(79,70,229,0.25)] min-h-[52px]"
                  >
                    <Sparkles className="w-5 h-5" />
                    Coba Gratis — 3 Foto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
