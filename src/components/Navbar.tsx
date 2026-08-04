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

  const navLinks = [
    { href: '#cara-kerja', label: 'Cara Kerja' },
    { href: '#fitur', label: 'Fitur' },
    { href: '#integrity', label: 'Integrity Engine' },
    { href: '#harga', label: 'Harga' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/90 backdrop-blur-lg border-b border-surface-border py-2'
          : 'bg-transparent py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 lg:h-14">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <ZenLogo className="w-8 h-8 sm:w-9 sm:h-9 group-hover:scale-105 transition-transform" />
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-text">
              ZenStudio
            </span>
          </a>

          {/* Desktop Nav Links — editorial, clean text */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-1.5 text-sm font-medium text-text-muted hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-px after:bg-primary after:transition-all hover:after:w-3/4"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {!ready ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : isSignedIn ? (
              <>
                <Link to="/studio" className="text-text-muted hover:text-primary font-semibold text-sm transition-colors">
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
                  className="text-text-muted hover:text-primary font-semibold text-sm transition-colors px-3 py-2"
                >
                  Masuk
                </button>
                <button
                  onClick={handleOpenSignUp}
                  className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 shadow-[0_2px_12px_rgba(212,69,42,0.25)]"
                >
                  <Sparkles className="w-4 h-4" />
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
                className="bg-primary text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-[0_1px_8px_rgba(212,69,42,0.2)]"
              >
                <Sparkles className="w-3 h-3" />
                3 Foto Gratis
              </button>
            ) : null}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-text-muted hover:text-primary border border-transparent hover:border-surface-border focus:outline-none min-w-[40px] min-h-[40px]"
              aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Full-Screen Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-[56px] z-40 bg-background lg:hidden overflow-y-auto">
          <div className="px-4 pt-6 pb-8 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-4 rounded-xl text-base font-semibold text-text hover:text-primary hover:bg-surface transition-colors min-h-[52px] font-display"
              >
                {link.label}
              </a>
            ))}

            {/* Mobile Auth Section */}
            <div className="pt-6 mt-4 border-t border-surface-border space-y-3">
              {!ready ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : isSignedIn ? (
                <div className="space-y-3">
                  <Link
                    to="/studio"
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-primary text-white px-4 py-4 rounded-xl text-base font-bold flex items-center gap-2 justify-center min-h-[52px]"
                  >
                    <Sparkles className="w-5 h-5" />
                    Masuk Studio
                  </Link>
                  <div className="flex items-center justify-between px-4 py-3 bg-surface rounded-xl border border-surface-border">
                    <span className="text-sm font-medium text-text">Profil & Akun</span>
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
                    className="w-full px-4 py-4 rounded-xl text-base font-semibold text-text hover:text-primary hover:bg-surface transition-colors text-left min-h-[52px]"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); handleOpenSignUp(); }}
                    className="w-full bg-primary text-white px-4 py-4 rounded-xl text-base font-bold flex items-center gap-2 justify-center min-h-[52px]"
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
