import { SignedIn, SignedOut, RedirectToSignIn, UserButton, useAuth } from "@clerk/clerk-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useApiClient } from "../services/api";
import { Loader2, Upload, Sparkles, Image as ImageIcon, Trash2, Download, Home, Zap, AlertTriangle, RefreshCw, Wand2, CheckCircle2, XCircle, Copy, Check } from 'lucide-react';
import ZoomableImage from '../components/ZoomableImage';
import { ZenLogo } from '../components/ZenLogo';
import { PromptGeneratorModal } from '../components/PromptGeneratorModal';
import { useTopUp } from "../context/TopUpContext";
import { usePaymentStatus } from "../hooks/usePaymentStatus";

const OpenAIIcon = ({ className }: { className?: string }) => (
  <svg 
    role="img" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="currentColor"
  >
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.103 8.3685v-2.333a.0804.0804 0 0 1 .0332-.0615l4.8729-2.815a4.4992 4.4992 0 0 1 6.1408 1.6464 4.4708 4.4708 0 0 1 .5346 3.0137l-.1419-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0zM22.004 14.225a4.485 4.485 0 0 1-2.3655 1.9728V10.511a.7664.7664 0 0 0-.3879-.6765L13.4362 6.4802l2.0201-1.1685a.0757.0757 0 0 1 .071 0l4.8303 2.7866a4.504 4.504 0 0 1-2.3536 6.1268zM12 15.1585l-3.2372-1.8693v-3.7386L12 7.6813l3.2372 1.8693v3.7386z"/>
  </svg>
);

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="currentColor"
  >
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
);

export default function StudioDashboard() {
  const [credits, setCredits] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [provider, setProvider] = useState("gptimage");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1k");
  const [outputFormat, setOutputFormat] = useState("jpg");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generationHistory, setGenerationHistory] = useState<any[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // UI State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { isLoaded, isSignedIn } = useAuth();
  const api = useApiClient();
  const { openTopUp } = useTopUp();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSyncReplicate = useCallback(async (isSilent = true) => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const res: any = await api.syncReplicate();
      if (res && res.success) {
        if (res.generations) {
          setGenerationHistory(res.generations);
        }
        if (typeof res.remainingCredits === "number") {
          setCredits(res.remainingCredits);
        }
      }
    } catch (err: any) {
      if (!isSilent) {
        console.warn("Background sync error:", err);
      }
    }
  }, [isLoaded, isSignedIn, api]);

  const loadProfile = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const res: any = await api.getProfile();
      if (res && res.data) {
        setCredits(res.data.credits?.remainingCredits ?? 0);
        setGenerationHistory(res.data.generations || []);
      }
      handleSyncReplicate(true);
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setProfileError(err.message || "Gagal memuat profil & riwayat gambar.");
    } finally {
      setIsLoadingProfile(false);
    }
  }, [isLoaded, isSignedIn, api, handleSyncReplicate]);

  // ── Payment return detection ───────────────────────────
  const [paymentBanner, setPaymentBanner] = useState<"success" | "failed" | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const paymentReturnHandled = useRef(false);

  const paymentStatus = usePaymentStatus(pendingOrderId);

  // Detect ?payment=success or ?payment=failed on mount (ref-guarded, no stale closure)
  useEffect(() => {
    if (paymentReturnHandled.current) return;
    const paymentParam = searchParams.get("payment");
    if (!paymentParam) return;
    paymentReturnHandled.current = true;

    if (paymentParam === "success") {
      const storedOrderId = sessionStorage.getItem("lastPaymentOrderId");
      if (storedOrderId) {
        setPaymentBanner("success");
        setPendingOrderId(storedOrderId);
      } else {
        loadProfile();
        setPaymentBanner("success");
        setTimeout(() => setPaymentBanner(null), 30_000);
      }
      const next = new URLSearchParams(searchParams);
      next.delete("payment");
      setSearchParams(next, { replace: true });
    } else if (paymentParam === "failed") {
      setPaymentBanner("failed");
      setTimeout(() => setPaymentBanner(null), 30_000);
      const next = new URLSearchParams(searchParams);
      next.delete("payment");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, loadProfile]);

  // When polling settles, refresh credits and show success
  useEffect(() => {
    if (paymentStatus.status === "settled") {
      loadProfile();
      setPaymentBanner("success");
      sessionStorage.removeItem("lastPaymentOrderId");
      setPendingOrderId(null);
      // Auto-dismiss success banner after 8s once settled
      const timer = setTimeout(() => setPaymentBanner(null), 8_000);
      return () => clearTimeout(timer);
    } else if (paymentStatus.status === "expired" || paymentStatus.status === "failed") {
      setPaymentBanner("failed");
      sessionStorage.removeItem("lastPaymentOrderId");
      setPendingOrderId(null);
      // Auto-dismiss failure banner after 10s
      const timer = setTimeout(() => setPaymentBanner(null), 10_000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus.status, loadProfile]);

  // Track latest blob URL via ref so unmount cleanup always revokes the current one
  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);
  useEffect(() => {
    return () => {
      if (previewUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadProfile();

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          handleSyncReplicate(true);
        }
      };

      window.addEventListener("focus", handleVisibilityChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        window.removeEventListener("focus", handleVisibilityChange);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const compressImage = (file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Gagal memproses gambar pada canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validasi ukuran file (Max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        alert("Ukuran file terlalu besar! Maksimal 10MB.");
        e.target.value = ''; // Reset input
        return;
      }

      // Revoke previous blob URL to prevent memory leak
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(URL.createObjectURL(file));
      
      try {
        const compressedBase64 = await compressImage(file);
        setImageBase64(compressedBase64);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleGenerate = async () => {
    if (!previewUrl || credits === 0 || !imageBase64) return;

    const resString = (resolution || "").toLowerCase();
    let creditsToDeduct = resString === "4k" ? 2 : 1;
    if (provider === "nanobanana" || provider === "nanobanana2") {
      creditsToDeduct = 2;
    }

    if (credits !== null && credits < creditsToDeduct) {
      setGenerateError(`Kredit tidak cukup. Dibutuhkan ${creditsToDeduct} kredit untuk resolusi ini.`);
      return;
    }

    const previousCredits = credits;
    // Optimistic UI deduction for instant visual feedback
    if (credits !== null) {
      setCredits(prev => (prev !== null ? Math.max(0, prev - creditsToDeduct) : prev));
    }

    setIsGenerating(true);
    setGenerateError(null);
    setGenerationStatus("Mengirimkan permintaan ke server AI...");

    const timer1 = setTimeout(() => {
      setGenerationStatus("Sedang merakit gambar dengan AI...");
    }, 10000);

    const timer2 = setTimeout(() => {
      setGenerationStatus("Membutuhkan waktu ekstra untuk resolusi tinggi... Harap tunggu sebentar.");
    }, 35000);

    try {
      // Mengirimkan gambar asli (base64) ke backend
      const res = await api.generateImage({
        imageUrl: imageBase64,
        prompt: prompt,
        provider: provider,
        aspectRatio: aspectRatio,
        resolution: resolution,
        outputFormat: outputFormat
      });
      
      if (res && res.data && typeof res.data.remainingCredits === "number") {
        setCredits(res.data.remainingCredits);
      }
      
      // Update generation history with the new generated image
      if (res && res.data && res.data.generation) {
        setGenerationHistory(prev => [res.data.generation, ...prev]);
      }

      // Auto-sync in background to keep DB and UI 100% aligned
      handleSyncReplicate(true);
    } catch (error: any) {
      console.error("Error during generation:", error);
      const errMsg = error?.message || "Gagal memproses gambar.";
      setGenerateError(errMsg);

      // Revert optimistic deduction if client request immediately failed
      if (previousCredits !== null) {
        setCredits(previousCredits);
      }

      // Background recovery sync in case server process completes asynchronously
      setTimeout(() => {
        handleSyncReplicate(true);
      }, 4000);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setGenerationStatus(null);
      setIsGenerating(false);
    }
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    try {
      await api.deleteGeneration(imageToDelete);
      setGenerationHistory(prev => prev.filter(item => item.id !== imageToDelete));
    } catch (error) {
      alert("Failed to delete image. " + (error as Error).message);
    } finally {
      setImageToDelete(null);
    }
  };

  const handleDownload = async (url: string, filename: string = 'generated-image.jpg') => {
    try {
      // Create an object URL to bypass some CORS and force download
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download fetch failed, opening in new tab", error);
      // Fallback if fetch fails (e.g. CORS block)
      window.open(url, '_blank');
    }
  };

  const handleCopy = async (text: string, field: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <>
      <SignedIn>
        <div className="min-h-[100dvh] bg-[#F8FAFC] font-sans text-slate-900">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ZenLogo className="w-9 h-9 shadow-sm" />
                <span className="font-bold text-xl tracking-tight text-slate-800">ZenStudio</span>
              </div>
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => openTopUp()}
                  className="flex items-center gap-3 bg-white border border-slate-200 p-1 pl-3 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-amber-400 blur-sm opacity-40 group-hover:opacity-70 transition-opacity"></div>
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500 relative z-10" />
                    </div>
                    <span className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                      {credits !== null ? (
                        credits
                      ) : isLoadingProfile ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); loadProfile(); }} 
                          title="Klik untuk memuat ulang"
                          className="text-xs text-red-500 hover:text-red-600 font-semibold underline flex items-center gap-1"
                        >
                          Retry <RefreshCw className="w-3 h-3" />
                        </button>
                      )} 
                      <span className="text-slate-400 font-semibold hidden sm:inline">Kredit</span>
                    </span>
                  </div>
                  <button
                    className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full group-hover:bg-indigo-600 transition-colors shadow-sm cursor-pointer"
                  >
                    Top Up
                  </button>
                </div>
                <UserButton afterSignOutUrl="/">
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label="Home"
                      labelIcon={<Home size={15} />}
                      href="/"
                    />
                    <UserButton.Action label="manageAccount" />
                    <UserButton.Action label="signOut" />
                  </UserButton.MenuItems>
                </UserButton>

              </div>
            </div>
          </header>

          {/* Payment return banner */}
          {paymentBanner === "success" && (
            <div className="bg-emerald-50 border-b border-emerald-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Pembayaran berhasil!</p>
                  <p className="text-xs text-emerald-600">
                    {paymentStatus.status === "settled"
                      ? `+${paymentStatus.credits} kredit telah ditambahkan.`
                      : "Kredit sedang diproses. Saldo akan diperbarui otomatis."}
                  </p>
                </div>
                <button
                  onClick={() => setPaymentBanner(null)}
                  className="ml-auto text-emerald-500 hover:text-emerald-700"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {paymentBanner === "failed" && (
            <div className="bg-red-50 border-b border-red-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Pembayaran gagal atau dibatalkan.</p>
                  <p className="text-xs text-red-600">Silakan coba lagi atau gunakan metode pembayaran lain.</p>
                </div>
                <button
                  onClick={() => setPaymentBanner(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Left Column: Form Inputs (Replicate Style) */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
                  
                  {/* Header Form */}
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Parameter Model
                    </h2>
                  </div>

                  {/* Input Fields */}
                  <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    
                    {/* Image Input */}
                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-bold text-slate-800">
                        Image <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`border-2 border-dashed rounded-xl overflow-hidden transition-colors ${previewUrl ? 'border-indigo-300' : 'border-slate-300 group-hover:border-indigo-400 bg-slate-50'}`}>
                          {previewUrl ? (
                            <div className="relative aspect-square">
                              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">Ganti Foto</span>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-square flex flex-col items-center justify-center p-8 text-center">
                              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                <Upload className="w-5 h-5 text-indigo-400" />
                              </div>
                              <p className="font-medium text-slate-700 mb-1">Upload a file</p>
                              <p className="text-xs text-slate-500 mb-4">or drag and drop here (Max 10MB)</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-bold text-slate-800">
                        Prompt <span className="text-red-500 ml-1">*</span>
                      </label>

                      {/* ── Auto Generate Prompt – Mobile-First Prominent CTA ── */}
                      <div className="relative group/gen">
                        {/* Glow aura: fixed box-shadow, opacity-only animation → GPU layer */}
                        <div
                          className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 blur-lg animate-glow-pulse pointer-events-none shadow-[0_0_35px_rgba(99,102,241,0.35)]"
                          style={{ willChange: 'opacity' }}
                          aria-hidden="true"
                        />

                        {/* Floating sparkle particles (2 instead of 3 — lighter) */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" aria-hidden="true">
                          <div className="absolute top-1/3 left-[15%] w-1.5 h-1.5 bg-amber-400 rounded-full animate-sparkle-drift-1" style={{ willChange: 'transform, opacity' }} />
                          <div className="absolute top-1/2 left-[70%] w-1 h-1 bg-cyan-400 rounded-full animate-sparkle-drift-2" style={{ willChange: 'transform, opacity' }} />
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsPromptModalOpen(true)}
                          className="relative w-full flex items-center gap-3 p-3.5 bg-white border-2 border-indigo-200/60 hover:border-indigo-400/80 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group active:scale-[0.98] min-h-[56px]"
                          style={{
                            backgroundImage:
                              'linear-gradient(white, white), linear-gradient(135deg, #6366f1 0%, #a855f7 40%, #06b6d4 80%)',
                            backgroundOrigin: 'border-box',
                            backgroundClip: 'padding-box, border-box',
                          }}
                        >
                          {/* Animated icon pill */}
                          <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
                              <Wand2 className="w-5 h-5 text-white animate-icon-pop" style={{ willChange: 'transform' }} />
                            </div>
                            {/* Pulsing dot */}
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3">
                              <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
                              <span className="absolute inset-0 rounded-full bg-amber-400" />
                            </div>
                          </div>

                          {/* Text + badge */}
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-800 text-sm leading-tight">
                                Auto Generate Prompt
                              </span>
                              <span className="text-[10px] font-black bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-2 py-0.5 rounded-full tracking-wide whitespace-nowrap">
                                ✦ AI
                              </span>
                            </div>
                            <p className="text-[12px] text-slate-500 font-medium mt-0.5 leading-tight hidden xs:block">
                              8 preset profesional • Kustom builder • 1-klik
                            </p>
                          </div>

                          {/* Arrow indicator */}
                          <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                            <svg
                              className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>

                          {/* Shimmer sweep — only on hover, not continuously */}
                          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/25 to-transparent" style={{ willChange: 'transform' }} />
                          </div>
                        </button>
                      </div>

                      <div className="relative">
                        <textarea 
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          rows={3}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-base md:text-sm font-medium text-slate-700"
                          placeholder="Contoh: Premium studio lighting, professional product photography on black marble..."
                        />
                        {prompt && (
                          <button
                            type="button"
                            onClick={() => handleCopy(prompt, 'prompt')}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                            aria-label="Salin prompt"
                          >
                            {copiedField === 'prompt' ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Quick Prompt Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] font-bold text-slate-400">Preset Cepat:</span>
                        <button
                          type="button"
                          onClick={() => setPrompt("High-end luxury studio photograph resting on a polished dark black marble pedestal, fine gold dust particles floating, dramatic cinematic rim light, crisp reflections, 8k resolution")}
                          className="text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold px-2 py-0.5 rounded-md border border-amber-200/60 transition-colors"
                        >
                          💎 Luxury Marble
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrompt("Professional commercial product photograph on a smooth beige stone pedestal, surrounded by soft green eucalyptus leaves and water droplets, soft morning sunbeams, 8k resolution")}
                          className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2 py-0.5 rounded-md border border-emerald-200/60 transition-colors"
                        >
                          🧴 Organic Skincare
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrompt("Professional studio product photo on a seamless clean white background, soft diffused 3-point softbox studio lighting, subtle soft contact shadow, sharp focus, high conversion marketplace ad look")}
                          className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-2 py-0.5 rounded-md border border-indigo-200/60 transition-colors"
                        >
                          🛍️ Tokopedia White
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrompt("Commercial food photography on a rustic dark oak wooden tabletop, warm ambient sunlight, shallow depth of field, cozy cafe background bokeh, 8k")}
                          className="text-[10px] bg-orange-50 text-orange-700 hover:bg-orange-100 font-bold px-2 py-0.5 rounded-md border border-orange-200/60 transition-colors"
                        >
                          ☕ Cafe Bokeh
                        </button>
                        {prompt && (
                          <button
                            type="button"
                            onClick={() => setPrompt("")}
                            className="text-[10px] bg-slate-100 text-slate-500 hover:text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200 transition-colors"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* AI Engine Selection */}
                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-bold text-slate-800">
                        AI Engine
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* OpenAI GPT-Image */}
                        <button
                          type="button"
                          onClick={() => setProvider("gptimage")}
                          className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${provider === "gptimage" ? "bg-emerald-50 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}
                        >
                          <div className="absolute top-2 right-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          </div>
                          <div className={`p-2 rounded-lg ${provider === "gptimage" ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"}`}>
                            <OpenAIIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className={`font-bold text-sm ${provider === "gptimage" ? "text-emerald-700" : "text-slate-700"}`}>OpenAI</div>
                            <div className="text-[10px] text-slate-500">GPT-Image 1.5</div>
                          </div>
                        </button>
                        
                        {/* Nano Banana Pro */}
                        <button
                          type="button"
                          onClick={() => setProvider("nanobanana")}
                          className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${provider === "nanobanana" ? "bg-amber-50 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.15)]" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}
                        >
                          <div className="absolute top-2 right-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          </div>
                          <div className={`p-2 rounded-lg ${provider === "nanobanana" ? "bg-amber-100 text-amber-500" : "bg-slate-200 text-slate-500"}`}>
                            <GoogleIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className={`font-bold text-sm ${provider === "nanobanana" ? "text-amber-700" : "text-slate-700"}`}>Google</div>
                            <div className="text-[10px] text-slate-500">Nano Banana Pro</div>
                          </div>
                        </button>
                        
                        {/* Nano Banana 2 */}
                        <button
                          type="button"
                          onClick={() => setProvider("nanobanana2")}
                          className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${provider === "nanobanana2" ? "bg-cyan-50 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}
                        >
                          <div className="absolute top-2 right-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          </div>
                          <div className={`p-2 rounded-lg ${provider === "nanobanana2" ? "bg-cyan-100 text-cyan-500" : "bg-slate-200 text-slate-500"}`}>
                            <GoogleIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className={`font-bold text-sm ${provider === "nanobanana2" ? "text-cyan-700" : "text-slate-700"}`}>Google</div>
                            <div className="text-[10px] text-slate-500">Nano Banana 2</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Aspect Ratio */}
                      <div className="space-y-3">
                        <label className="flex items-center text-sm font-bold text-slate-800">
                          Aspect Ratio
                        </label>
                        <select 
                          value={aspectRatio} 
                          onChange={(e) => setAspectRatio(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-base md:text-sm font-medium text-slate-700"
                        >
                          <option value="1:1">1:1 (Square - Tokopedia, Shopee, IG Feed)</option>
                          <option value="9:16">9:16 (Vertical - TikTok, IG Reels, Shorts)</option>
                          <option value="4:5">4:5 (Portrait - Instagram Feed)</option>
                          <option value="16:9">16:9 (Landscape - YouTube, Web Banner)</option>
                          <option value="2:3">2:3 (Pin - Pinterest)</option>
                        </select>
                      </div>

                      {/* Resolution */}
                      <div className="space-y-3">
                        <label className="flex items-center text-sm font-bold text-slate-800">
                          Resolution
                        </label>
                        <select 
                          value={resolution} 
                          onChange={(e) => {
                            const newRes = e.target.value;
                            setResolution(newRes);
                            setPrompt(prev => {
                              if (!prev) return prev;
                              let updated = prev.replace(/(1k|2k|4k|8k)\s*resolution/gi, `${newRes.toLowerCase()} resolution`);
                              
                              if (updated === prev) {
                                updated = updated.replace(/\b(1k|2k|4k|8k)\b/gi, newRes.toLowerCase());
                              }
                              
                              // If no resolution was found and replaced, append it automatically
                              if (updated === prev && prev.trim().length > 0) {
                                const trimmed = updated.trim();
                                if (trimmed.endsWith('.') || trimmed.endsWith(',')) {
                                  updated = `${trimmed} ${newRes.toLowerCase()} resolution`;
                                } else {
                                  updated = `${trimmed}, ${newRes.toLowerCase()} resolution`;
                                }
                              }
                              
                              return updated;
                            });
                          }}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-base md:text-sm font-medium text-slate-700"
                        >
                          <option value="1k">1K (Standard - 1024px)</option>
                          <option value="2k">2K (High - 2048px)</option>
                          <option value="4k">4K (Ultra - 4096px)</option>
                        </select>
                      </div>

                      {/* Output Format */}
                      <div className="space-y-3 col-span-2">
                        <label className="flex items-center text-sm font-bold text-slate-800">
                          Output Format
                        </label>
                        <select 
                          value={outputFormat} 
                          onChange={(e) => setOutputFormat(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-base md:text-sm font-medium text-slate-700"
                        >
                          <option value="jpg">JPG (Disarankan)</option>
                          <option value="png">PNG</option>
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* Sticky Footer / Run Button */}
                  <div className="p-4 border-t border-slate-200 bg-white">
                    {credits === 0 && !isGenerating ? (
                      <button
                        onClick={() => openTopUp()}
                        className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
                      >
                        <Zap className="w-5 h-5" />
                        Kredit Habis — Top Up Sekarang
                      </button>
                    ) : (
                      <button
                        onClick={handleGenerate}
                        disabled={!previewUrl || isGenerating}
                        className="w-full py-3.5 bg-black hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        {isGenerating ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Sedang Memproses...</>
                        ) : (
                          <>Transform <span className="text-slate-300 font-medium text-sm ml-1 px-2 py-0.5 bg-white/20 rounded-md">-{(provider === 'nanobanana' || provider === 'nanobanana2') ? 2 : (resolution === '4k' ? 2 : 1)} Kredit</span></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Gallery */}
              <div className="lg:col-span-7">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full min-h-[600px] flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900">
                      Galeri & Hasil
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200" title="Sistem tersinkronisasi otomatis">
                      <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin flex-shrink-0" />
                      <span>Live Sync</span>
                    </div>
                  </div>

                  {profileError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <span>{profileError}</span>
                      </div>
                      <button
                        onClick={loadProfile}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors flex-shrink-0"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  )}

                  {generateError && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <span>{generateError}</span>
                      </div>
                      <button
                        onClick={() => setGenerateError(null)}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-900 px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded transition-colors flex-shrink-0"
                      >
                        Tutup
                      </button>
                    </div>
                  )}
                  
                  {generationHistory.length === 0 && !isGenerating ? (
                    <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl flex-1 transition-all">
                      <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                      <p className="font-medium text-slate-600">Belum ada hasil generate.</p>
                      <p className="text-sm text-slate-400">Upload foto dan klik Generate untuk mulai!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[400px] content-start">
                      {isGenerating && (
                        <div className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50">
                             <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                             <span className="text-sm font-bold text-indigo-700">Proses Generasi...</span>
                             <span className="text-xs font-medium text-indigo-500 text-center px-4 mt-1">{generationStatus || "Sedang memproses gambar"}</span>
                          </div>
                        </div>
                      )}
                      {generationHistory.map((item, idx) => (
                        <div key={item.id || idx} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          {item.processedUrl ? (
                            <img
                              src={item.processedUrl}
                              alt="Generated Studio Result"
                              loading="lazy"
                              className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                              onClick={() => setSelectedImage(item.processedUrl)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'; // Image load failed — hide broken image
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50">
                               <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                               <span className="text-xs font-medium text-indigo-600">Processing...</span>
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs font-medium truncate pr-8">{item.preset}</p>
                          </div>
                          {item.id && (
                            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => handleDownload(item.processedUrl, `prodify-${item.id}.jpg`)}
                                className="p-1.5 bg-black/40 text-white rounded-lg hover:bg-indigo-500 backdrop-blur-sm transition-colors"
                                title="Download Image"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setImageToDelete(item.id)}
                                className="p-1.5 bg-black/40 text-white rounded-lg hover:bg-red-500 backdrop-blur-sm transition-colors"
                                title="Delete Image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </main>
        </div>

        {/* Delete Confirmation Modal */}
        {imageToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border-4 border-red-100">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">Hapus Gambar?</h3>
              <p className="text-slate-500 text-sm mb-8 font-medium">
                Gambar ini akan dihapus secara permanen dan tidak dapat dikembalikan.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setImageToDelete(null)} 
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5 transition-all"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal / Lightbox */}
        {selectedImage && (
          <ZoomableImage src={selectedImage} onClose={() => setSelectedImage(null)} />
        )}

        {/* AI Auto Prompt Generator Modal */}
        <PromptGeneratorModal 
          isOpen={isPromptModalOpen} 
          onClose={() => setIsPromptModalOpen(false)} 
          onApplyPrompt={(generatedPrompt) => setPrompt(generatedPrompt)} 
          currentResolution={resolution}
        />


      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
