import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Zap, Layers, Shield, CreditCard, HelpCircle } from 'lucide-react';
import { UserButton, useAuth, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ZenLogo } from './ZenLogo';

const navLinks = [
  { href: '#cara-kerja', label: 'Cara Kerja', icon: Zap },
  { href: '#fitur', label: 'Fitur', icon: Layers },
  { href: '#integrity', label: 'Integrity Engine', icon: Shield },
  { href: '#harga', label: 'Harga', icon: CreditCard },
  { href: '#faq', label: 'FAQ', icon: HelpCircle },
];

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

  // rAF-throttled scroll listener
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // iOS-safe scroll lock
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.getElementById('root')?.setAttribute('aria-hidden', 'true');
      return () => {
        const html = document.documentElement;
        // Disable smooth scrolling temporarily to prevent 'anchor effect' jumping
        html.style.setProperty('scroll-behavior', 'auto', 'important');

        // Clear fixed positioning first so the document regains its scroll height
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.getElementById('root')?.removeAttribute('aria-hidden');

        // Scroll immediately synchronously (don't wait for rAF, which can cause layout thrashing on mobile)
        window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' } as ScrollToOptions);
        
        // Wait slightly before restoring smooth scroll to ensure the instant scroll is fully processed
        setTimeout(() => {
          html.style.removeProperty('scroll-behavior');
        }, 10);
      };
    }
  }, [isOpen]);

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);

  // Close menu on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => firstMenuItemRef.current?.focus());
    } else {
      hamburgerRef.current?.focus();
    }
  }, [isOpen]);

  // Close menu if viewport resizes to desktop
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsOpen(false);
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return (
    <>
      <nav
        data-component="nav"
        className={`fixed w-full z-[60] transition-all duration-300 pt-[env(safe-area-inset-top)] ${
          isScrolled
            ? 'bg-background/90 backdrop-blur-lg border-b border-surface-border py-1.5'
            : 'bg-transparent py-2'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2 sm:gap-2.5 group shrink-0" aria-label="ZenStudio — Beranda">
              <ZenLogo className="h-11 group-hover:scale-105 transition-transform" />
            </a>

            {/* Desktop Nav Links */}
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

            {/* Mobile Toggle — Animated Hamburger */}
            <div className="flex items-center gap-2 lg:hidden">
              {!ready ? null : !isSignedIn ? (
                <button
                  onClick={handleOpenSignUp}
                  className="bg-primary text-white px-3 py-2.5 rounded-full text-xs font-bold hidden xs:inline-flex items-center gap-1 shadow-[0_1px_8px_rgba(212,69,42,0.2)] min-h-[44px]"
                >
                  <Sparkles className="w-3 h-3" />
                  3 Foto Gratis
                </button>
              ) : null}
              <button
                ref={hamburgerRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[44px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isOpen
                    ? 'bg-primary/10 border border-primary/30 text-primary shadow-[0_0_15px_rgba(212,69,42,0.3)]'
                    : 'text-text hover:text-primary bg-surface/60 border border-surface-border hover:border-primary/40'
                } ${isOpen ? 'hamburger-open' : ''}`}
                aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={isOpen}
              >
                <span className="flex flex-col items-center justify-center gap-[5px] w-5 h-5">
                  <span className={`hamburger-bar hamburger-bar-1 ${isOpen ? 'hamburger-bar-1' : ''}`} />
                  <span className={`hamburger-bar hamburger-bar-2 ${isOpen ? 'hamburger-bar-2' : ''}`} />
                  <span className={`hamburger-bar hamburger-bar-3 ${isOpen ? 'hamburger-bar-3' : ''}`} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Full-Screen Overlay */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu navigasi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
              className="fixed inset-0 z-[70] min-h-[100dvh] bg-background/90 backdrop-blur-3xl lg:hidden overflow-y-auto overscroll-contain flex flex-col"
            >
              {/* Ambient glow mesh */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] h-[50vh] bg-[radial-gradient(ellipse_at_top,rgba(212,69,42,0.15)_0%,transparent_70%)] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-[100vw] h-[50vh] bg-[radial-gradient(ellipse_at_bottom_right,rgba(61,139,125,0.1)_0%,transparent_70%)] pointer-events-none" />

              {/* Header with close button */}
              <div
                className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg px-4 flex items-center justify-between h-12 border-b border-surface-border/50"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
              >
                <a href="#" onClick={() => setIsOpen(false)} className="flex items-center gap-2 group shrink-0" aria-label="ZenStudio — Beranda">
                  <ZenLogo className="h-11" />
                </a>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[44px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isOpen
                      ? 'bg-primary/10 border border-primary/30 text-primary shadow-[0_0_12px_rgba(212,69,42,0.25)] close-rotate close-rotate-active'
                      : 'text-text hover:text-primary bg-surface/60 border border-surface-border hover:border-primary/40 close-rotate'
                  }`}
                  aria-label="Tutup menu"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Menu Content */}
              <div className="px-6 pb-6 pt-6 flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                {/* Nav Links with sleek minimalist style */}
                <div className="flex flex-col space-y-2">
                  {navLinks.map((link, i) => {
                    return (
                      <motion.a
                        key={link.href}
                        ref={i === 0 ? firstMenuItemRef : undefined}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.35, ease: 'easeOut' }}
                        className="group flex items-center gap-4 px-4 py-3.5 rounded-xl text-text hover:text-primary hover:bg-surface/50 transition-all duration-200 active:scale-[0.98]"
                      >
                        <span className="text-xs font-mono text-primary/60 font-semibold tracking-widest group-hover:text-primary transition-colors">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xl sm:text-2xl font-bold tracking-tight">
                          {link.label}
                        </span>
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.a>
                    );
                  })}
                </div>
              </div>

              {/* Auth Section with stagger */}
              <div className="px-6 pb-10 max-w-md mx-auto w-full">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  {!ready ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : isSignedIn ? (
                    <div className="space-y-3">
                      <Link
                        to="/studio"
                        onClick={() => setIsOpen(false)}
                        className="w-full bg-primary text-white px-4 py-3.5 rounded-xl text-base font-bold flex items-center gap-2.5 justify-center shadow-[0_4px_20px_rgba(212,69,42,0.25)] hover:shadow-[0_6px_25px_rgba(212,69,42,0.35)] active:scale-[0.98] transition-all duration-200"
                      >
                        <Sparkles className="w-5 h-5" />
                        Masuk Studio
                      </Link>
                      <div className="flex items-center justify-between px-4 py-3.5 bg-surface/60 backdrop-blur-md rounded-xl border border-surface-border">
                        <span className="text-sm font-semibold text-text">Profil & Akun</span>
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
                        onClick={() => { setIsOpen(false); handleOpenSignUp(); }}
                        className="w-full bg-primary text-white px-4 py-3.5 rounded-xl text-base font-bold flex items-center gap-2.5 justify-center shadow-[0_4px_20px_rgba(212,69,42,0.25)] hover:shadow-[0_6px_25px_rgba(212,69,42,0.35)] active:scale-[0.98] transition-all duration-200"
                      >
                        <Sparkles className="w-5 h-5" />
                        Coba Gratis — 3 Foto
                      </button>
                      <button
                        onClick={() => { setIsOpen(false); handleOpenSignIn(); }}
                        className="w-full px-4 py-3.5 rounded-xl text-base font-semibold text-text hover:text-primary transition-all duration-200 text-center border border-surface-border bg-surface/40 backdrop-blur-md active:scale-[0.98]"
                      >
                        Masuk
                      </button>
                    </div>
                  )}
                </motion.div>

                {/* Bottom decorative sparkle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="mt-6 flex justify-center pb-2"
                >
                  <div className="flex items-center gap-2.5 text-text-muted/30 text-[11px] font-mono tracking-[0.2em] uppercase">
                    <Sparkles className="w-3 h-3 text-primary/40" />
                    <span>ZenStudio</span>
                    <Sparkles className="w-3 h-3 text-secondary/40" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default Navbar;
