import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ChevronRight, CreditCard, HelpCircle, Layers, Shield, Sparkles, X, Zap } from 'lucide-react';
import { UserButton, useAuth, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ZenLogo } from './ZenLogo';
import { handleSmoothScroll } from '../utils/smoothScroll';

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
        openSignIn({ fallbackRedirectUrl: '/studio' });
      }
    } catch (error) {
      console.error("Error opening sign-in modal:", error);
    }
  };

  const handleOpenSignUp = () => {
    try {
      if (typeof openSignUp === 'function') {
        openSignUp({ fallbackRedirectUrl: '/studio' });
      } else if (typeof openSignIn === 'function') {
        openSignIn({ fallbackRedirectUrl: '/studio' });
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

  const menuPanelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  // Focus management and keyboard focus trap for the modal dropdown.
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      const frame = requestAnimationFrame(() => firstMenuItemRef.current?.focus());

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsOpen(false);
          return;
        }

        if (e.key !== 'Tab') return;

        const focusableElements = Array.from(
          menuPanelRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ) ?? []
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        cancelAnimationFrame(frame);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      const isMobileViewport = typeof window.matchMedia === 'function'
        && window.matchMedia('(max-width: 1023px)').matches;
      if (isMobileViewport) {
        requestAnimationFrame(() => hamburgerRef.current?.focus());
      }
    }
  }, [isOpen]);

  // Close menu if viewport resizes to desktop
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
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
            ? 'bg-landing-bg/90 backdrop-blur-lg border-b border-landing-border py-1.5'
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
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className="px-4 py-1.5 text-sm font-medium text-landing-text-muted hover:text-landing-text transition-colors relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-px after:bg-landing-primary after:transition-all hover:after:w-3/4"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              {!ready ? (
                <div className="w-5 h-5 border-2 border-landing-primary border-t-transparent rounded-full animate-spin"></div>
              ) : isSignedIn ? (
                <>
                  <Link to="/studio" className="text-landing-text-muted hover:text-landing-text font-semibold text-sm transition-colors">
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
                    className="text-landing-text-muted hover:text-landing-text font-semibold text-sm transition-colors px-3 py-2"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={handleOpenSignUp}
                    className="bg-landing-text hover:bg-landing-text/90 text-landing-bg px-5 py-2.5 rounded-none text-sm font-medium transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Coba Gratis
                  </button>
                </>
              )}
            </div>

            {/* Mobile Toggle — Animated Hamburger */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                ref={hamburgerRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[44px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-landing-bg ${
                  isOpen
                    ? 'bg-landing-primary/10 border border-landing-primary/40 text-landing-primary shadow-[0_0_18px_rgba(217,38,169,0.2)]'
                    : 'text-landing-text hover:text-landing-primary bg-landing-surface/80 border border-landing-border hover:border-landing-primary/40'
                } ${isOpen ? 'hamburger-open' : ''}`}
                aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={isOpen}
                aria-controls="mobile-menu-panel"
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

      {/* Mobile Dropdown */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) setIsOpen(false);
              }}
              className="fixed inset-0 z-[70] min-h-[100dvh] bg-black/55 backdrop-blur-[2px] lg:hidden overflow-y-auto overscroll-contain flex items-start justify-end px-3 sm:px-5 pb-4 sm:pb-5"
              style={{
                pointerEvents: isOpen ? 'auto' : 'none',
                paddingTop: 'calc(4.75rem + env(safe-area-inset-top))',
              }}
            >
              <motion.div
                ref={menuPanelRef}
                id="mobile-menu-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-menu-title"
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                onPointerDown={(event) => event.stopPropagation()}
                className="scrollbar-none relative flex h-fit w-full max-w-[520px] max-h-[calc(100dvh-5.75rem)] flex-col overflow-y-auto overscroll-contain rounded-2xl border border-landing-border bg-landing-surface/95 text-landing-text shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
              >
                <div className="flex items-start justify-between gap-4 border-b border-landing-border px-5 py-4 sm:px-6">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.2em] text-landing-text-muted uppercase">ZenStudio / Menu</p>
                    <h2 id="mobile-menu-title" className="mt-1 font-landing-display text-xl font-medium tracking-tight text-landing-text">
                      Jelajahi Studio
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-landing-border bg-landing-bg/60 text-landing-text-muted transition-colors hover:border-landing-primary/50 hover:text-landing-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary/60"
                    aria-label="Tutup menu"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="relative px-3 py-4 sm:px-4">
                  <div
                    aria-hidden="true"
                    className="absolute bottom-4 left-4 top-4 w-px bg-gradient-to-b from-landing-primary via-landing-secondary to-transparent sm:left-5"
                  />
                  <nav aria-label="Navigasi utama" className="relative flex flex-col gap-1">
                    {navLinks.map((link, i) => {
                      const Icon = link.icon;
                      return (
                        <motion.a
                          key={link.href}
                          ref={i === 0 ? firstMenuItemRef : undefined}
                          href={link.href}
                          onClick={(e) => handleSmoothScroll(e, link.href, () => setIsOpen(false))}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.035, duration: 0.2, ease: 'easeOut' }}
                          className="group flex min-h-[56px] items-center gap-3 rounded-xl px-3 pl-6 text-landing-text-muted transition-colors duration-200 hover:bg-landing-bg/70 hover:text-landing-text active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-landing-primary/60 sm:pl-7"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-landing-border bg-landing-bg/70 text-landing-primary/80 transition-colors group-hover:border-landing-primary/40 group-hover:text-landing-primary">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="text-base font-medium tracking-tight sm:text-[17px]">{link.label}</span>
                          <ChevronRight className="ml-auto h-4 w-4 text-landing-text-muted/50 transition-transform group-hover:translate-x-0.5 group-hover:text-landing-primary" aria-hidden="true" />
                        </motion.a>
                      );
                    })}
                  </nav>
                </div>

                <div className="border-t border-landing-border px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-landing-text-muted uppercase">Ready to develop</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-landing-primary shadow-[0_0_10px_rgba(217,38,169,0.8)]" aria-hidden="true" />
                  </div>

                  {!ready ? (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-landing-primary border-t-transparent" aria-label="Memuat autentikasi" />
                    </div>
                  ) : isSignedIn ? (
                    <div className="space-y-3">
                      <Link
                        to="/studio"
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center justify-center gap-2 bg-landing-text px-4 py-3.5 text-sm font-medium text-landing-bg transition-all hover:bg-landing-text/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary/60"
                      >
                        Masuk Studio
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-landing-border bg-landing-bg/60 px-4 py-3">
                        <div>
                          <span className="block font-mono text-[9px] tracking-[0.16em] text-landing-text-muted uppercase">Account</span>
                          <span className="text-sm font-medium text-landing-text">Profil & Akun</span>
                        </div>
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
                        type="button"
                        onClick={() => { setIsOpen(false); handleOpenSignUp(); }}
                        className="flex w-full items-center justify-center gap-2 bg-landing-text px-4 py-3.5 text-sm font-medium text-landing-bg transition-all hover:bg-landing-text/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary/60"
                      >
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Coba Gratis · 3 Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsOpen(false); handleOpenSignIn(); }}
                        className="w-full rounded-xl border border-landing-border bg-landing-bg/60 px-4 py-3.5 text-sm font-medium text-landing-text-muted transition-colors hover:border-landing-primary/40 hover:text-landing-text active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary/60"
                      >
                        Masuk
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default Navbar;
