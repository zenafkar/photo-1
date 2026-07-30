import { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 py-3' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <img src="/favicon.png" alt="Prodify Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">Prodify</span>
          </a>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#fitur" className="text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm">Fitur</a>
              <a href="#integrity" className="text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm">Integrity Engine</a>
              <a href="#harga" className="text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm">Harga</a>
              <a href="#faq" className="text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm">FAQ</a>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-slate-600 hover:text-indigo-600 font-medium text-sm transition-colors">Masuk</button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Coba Gratis
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/studio" className="text-slate-600 hover:text-indigo-600 font-medium text-sm transition-colors">Studio</Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-50 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <a href="#fitur" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">Fitur</a>
            <a href="#integrity" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">Integrity Engine</a>
            <a href="#harga" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">Harga</a>
            <a href="#faq" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">FAQ</a>
            <SignedOut>
              <SignInButton mode="modal">
                <button onClick={() => setIsOpen(false)} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">Masuk</button>
              </SignInButton>
              <SignInButton mode="modal">
                <button onClick={() => setIsOpen(false)} className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                  Coba Gratis
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/studio" onClick={() => setIsOpen(false)} className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 justify-center shadow-sm">
                Masuk Studio
              </Link>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
