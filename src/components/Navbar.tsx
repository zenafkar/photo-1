import { useState, useEffect } from 'react';
import { Menu, X, Sparkles, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { UserButton, useAuth, useClerk, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ZenLogo } from './ZenLogo';
import { useApiClient } from '../services/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { openSignIn, signOut } = useClerk();
  const api = useApiClient();

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await api.deleteAccount();
      if (user) {
        await user.delete().catch((err) => {
          console.warn("Clerk user.delete() failed or restricted:", err);
        });
      }
      await signOut({ redirectUrl: "/" });
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      alert("Gagal menghapus akun: " + (error?.message || error));
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteAccountModalOpen(false);
    }
  };

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
      if (typeof openSignIn === 'function') {
        openSignIn({ fallbackRedirectUrl: '/studio', signUpFallbackRedirectUrl: '/studio' });
      }
    } catch (error) {
      console.error("Error opening sign-in modal:", error);
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
                <UserButton afterSignOutUrl="/">
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label="Studio Dashboard"
                      labelIcon={<Sparkles size={15} />}
                      href="/studio"
                    />
                    <UserButton.Action label="manageAccount" />
                    <UserButton.Action
                      label="Hapus Akun / Profile"
                      labelIcon={<Trash2 size={15} className="text-red-500" />}
                      onClick={() => setIsDeleteAccountModalOpen(true)}
                    />
                    <UserButton.Action label="signOut" />
                  </UserButton.MenuItems>
                </UserButton>
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
                  <UserButton afterSignOutUrl="/">
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="Studio Dashboard"
                        labelIcon={<Sparkles size={15} />}
                        href="/studio"
                      />
                      <UserButton.Action label="manageAccount" />
                      <UserButton.Action
                        label="Hapus Akun / Profile"
                        labelIcon={<Trash2 size={15} className="text-red-500" />}
                        onClick={() => {
                          setIsOpen(false);
                          setIsDeleteAccountModalOpen(true);
                        }}
                      />
                      <UserButton.Action label="signOut" />
                    </UserButton.MenuItems>
                  </UserButton>
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

      {/* Delete Account Confirmation Modal */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4 text-left">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-5 border-4 border-red-200">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Hapus Akun & Data Saya?</h3>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed font-medium">
              Tindakan ini <span className="font-bold text-red-600">tidak dapat dibatalkan</span>. Seluruh data riwayat generasi gambar, sisa kredit, serta profil akun Anda di database dan autentikasi akan dihapus secara permanen.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setIsDeleteAccountModalOpen(false)} 
                disabled={isDeletingAccount}
                className="flex-1 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteAccount} 
                disabled={isDeletingAccount}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Ya, Hapus Akun"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;


