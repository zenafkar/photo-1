import { useState, useRef, useEffect } from "react";
import { Zap, X, Loader2, Sparkles, ShoppingBag, AlertTriangle, ExternalLink } from "lucide-react";
import { useApiClient } from "../services/api";
import { PACKAGES, type PackageId, formatRupiah } from "../lib/packages";
import { openXenditCheckout } from "../lib/openXenditCheckout";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPackageId?: string;
}

type ModalState = "idle" | "creating" | "redirecting" | "error";

export function TopUpModal({ isOpen, onClose, defaultPackageId }: TopUpModalProps) {
  const api = useApiClient();
  const [selectedPackage, setSelectedPackage] = useState<PackageId>(
    (defaultPackageId as PackageId) || "pro"
  );
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stable idempotency key per purchase intent — regenerates only on package change.
  // Prevents duplicate invoices if the user retries after a network timeout.
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  useEffect(() => {
    idempotencyKeyRef.current = crypto.randomUUID();
  }, [selectedPackage]);

  if (!isOpen) return null;

  const selectedPkg = PACKAGES[selectedPackage];

  const handlePurchase = async () => {
    setModalState("creating");
    setErrorMessage(null);

    try {
      const res: any = await api.createPaymentOrder({
        packageId: selectedPackage,
        idempotencyKey: idempotencyKeyRef.current,
      });

      if (res?.success && res.data?.invoiceUrl) {
        // Save orderId so the dashboard can poll status after redirect-back
        sessionStorage.setItem("lastPaymentOrderId", res.data.orderId);
        setModalState("redirecting");
        // Brief delay so the user sees the "redirecting" state
        setTimeout(() => {
          openXenditCheckout(res.data.invoiceUrl);
          onClose();
          // Reset state after close
          setTimeout(() => {
            setModalState("idle");
            setSelectedPackage((defaultPackageId as PackageId) || "pro");
          }, 300);
        }, 200);
      } else if (res?.success && !res.data?.invoiceUrl) {
        // Idempotent replay of already-settled order (409 handled in api.ts as error)
        setErrorMessage("Pembayaran ini sudah selesai diproses sebelumnya.");
        setModalState("error");
      } else {
        setErrorMessage(res?.message || "Gagal membuat pesanan.");
        setModalState("error");
      }
    } catch (err: any) {
      const msg = err?.message || "";
      // Handle 409 (already settled) gracefully
      if (msg.includes("sudah selesai diproses") || msg.includes("409")) {
        setErrorMessage("Pembayaran ini sudah selesai diproses sebelumnya.");
      } else if (msg.includes("502") || msg.includes("gateway")) {
        setErrorMessage("Gateway pembayaran sedang sibuk. Silakan coba lagi dalam beberapa saat.");
      } else {
        setErrorMessage(msg || "Gagal menghubungi server. Silakan coba lagi.");
      }
      setModalState("error");
    }
  };

  const handleRetry = () => {
    setModalState("idle");
    setErrorMessage(null);
  };

  const isProcessing = modalState === "creating" || modalState === "redirecting";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header — matching PromptGeneratorModal gradient pattern */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 text-white flex items-center justify-between gap-3 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2.5 sm:gap-3 relative z-10 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black tracking-tight flex items-center gap-1.5 flex-wrap">
                <span>Top Up Kredit</span>
                <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  BAYAR PER PAKAI
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium truncate sm:whitespace-normal">
                Beli kredit AI untuk hasil foto profesional tanpa batas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="relative z-10 p-1.5 sm:p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Tutup"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-5">
          {/* Error state */}
          {modalState === "error" && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800">Gagal</p>
                <p className="text-sm text-red-600 mt-0.5">{errorMessage}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-sm font-semibold text-red-700 hover:text-red-800 underline"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          )}

          {/* Package cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Starter */}
            <button
              onClick={() => !isProcessing && setSelectedPackage("starter")}
              disabled={isProcessing}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                selectedPackage === "starter"
                  ? "border-slate-900 bg-slate-50 shadow-md"
                  : "border-slate-200 hover:border-slate-400 bg-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <h3 className="text-lg font-extrabold text-slate-900">Starter</h3>
              <p className="text-xs text-slate-500 mt-0.5">Untuk UMKM profesional</p>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900">{formatRupiah(PACKAGES.starter.price)}</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-slate-700">{PACKAGES.starter.credits} Kredit</span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">Dapat 10 Foto Siap Pakai</span>
            </button>

            {/* Pro */}
            <button
              onClick={() => !isProcessing && setSelectedPackage("pro")}
              disabled={isProcessing}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                selectedPackage === "pro"
                  ? "border-cyan-500 bg-cyan-50/50 shadow-md shadow-cyan-500/10"
                  : "border-slate-200 hover:border-cyan-400 bg-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {/* Popular badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-indigo-500 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center gap-1 whitespace-nowrap">
                <Sparkles className="w-3 h-3" /> PALING POPULER
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 mt-1">Pro</h3>
              <p className="text-xs text-slate-500 mt-0.5">Untuk posting rutin</p>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900">{formatRupiah(PACKAGES.pro.price)}</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                <span className="text-sm font-bold text-slate-700">{PACKAGES.pro.credits} Kredit</span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">Dapat 30 Foto Siap Pakai</span>
            </button>
          </div>

          {/* Price summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Paket {selectedPkg.label}</span>
              <span className="text-sm font-bold text-slate-900">{formatRupiah(selectedPkg.price)}</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm font-medium text-slate-600">Kredit</span>
              <span className="text-sm font-bold text-cyan-600">+{selectedPkg.credits} Kredit</span>
            </div>
            <div className="border-t border-slate-200 mt-3 pt-3 flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900">Total</span>
              <span className="text-lg font-extrabold text-slate-900">{formatRupiah(selectedPkg.price)}</span>
            </div>
          </div>

          {/* Action button */}
          {modalState === "redirecting" ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
              <p className="text-sm font-semibold text-slate-700">Membuka halaman pembayaran...</p>
              <p className="text-xs text-slate-400">Jika tidak terbuka otomatis, klik tombol di bawah</p>
              <button
                onClick={() => {
                  // This shouldn't normally be needed, but provides a manual fallback
                  onClose();
                }}
                className="text-sm text-cyan-600 hover:text-cyan-700 font-semibold underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka manual
              </button>
            </div>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-0.5 border border-cyan-400/50 disabled:border-transparent flex items-center justify-center gap-2"
            >
              {modalState === "creating" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Membuat Pesanan...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Beli {formatRupiah(selectedPkg.price)}
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <span className="font-medium">Supported By:</span>
            <img src="/icons/xendit.svg" alt="Xendit" className="h-4 w-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
