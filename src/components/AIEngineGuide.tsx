import { useEffect, useRef } from 'react';
import { Clock3, Info, Trophy, X } from 'lucide-react';

interface AIEngineGuideProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const rankings = [
  {
    rank: '01',
    name: 'Nano Banana Pro',
    provider: 'Google',
    className: 'border-amber-200 bg-amber-50/80',
    numberClassName: 'bg-amber-400 text-amber-950',
    nameClassName: 'text-amber-950',
    badge: 'Terbaik',
  },
  {
    rank: '02',
    name: 'Nano Banana 2',
    provider: 'Google',
    className: 'border-cyan-200 bg-cyan-50/70',
    numberClassName: 'bg-cyan-400 text-cyan-950',
    nameClassName: 'text-cyan-950',
  },
  {
    rank: '03',
    name: 'GPT-Image',
    provider: 'OpenAI',
    className: 'border-slate-200 bg-slate-50',
    numberClassName: 'bg-slate-300 text-slate-700',
    nameClassName: 'text-slate-800',
  },
];

const processingTimes = [
  { resolution: '1K', time: '< 30 detik' },
  { resolution: '2K', time: '30–45 detik' },
  { resolution: '4K', time: 'Lebih dari 45 detik' },
];

export function AIEngineGuide({ isOpen, onOpen, onClose }: AIEngineGuideProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label="Buka panduan penggunaan AI Engine"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-extrabold text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.5} />
        <span>Panduan</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-[2px] md:items-center md:p-4"
          onClick={onClose}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-engine-guide-title"
            onClick={(event) => event.stopPropagation()}
            className="ai-guide-panel relative max-h-[82dvh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white shadow-[0_24px_70px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5 md:max-w-[410px] md:rounded-[1.5rem]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 pb-4 pt-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/25 via-transparent to-cyan-400/25" />
                  <Info className="relative h-5 w-5 text-indigo-200" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-indigo-500">
                    Catatan uji • puluhan test
                  </p>
                  <h2 id="ai-engine-guide-title" className="text-[17px] font-extrabold leading-tight tracking-tight text-slate-900">
                    Panduan Penggunaan AI Engine
                  </h2>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Tutup panduan penggunaan AI Engine"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-5 pb-5 pt-4">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3.5 py-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-indigo-600">Dasar data</p>
                <p className="mt-1 text-[13px] font-medium leading-relaxed text-slate-600">
                  Ringkasan ini dibuat berdasarkan test yang telah dilakukan puluhan kali.
                </p>
              </div>

              <div>
                <div className="mb-2.5 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <h3 className="text-[12px] font-black uppercase tracking-[0.12em] text-slate-800">
                    Urutan kualitas output image
                  </h3>
                </div>
                <div className="space-y-2">
                  {rankings.map((engine) => (
                    <div
                      key={engine.name}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${engine.className}`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${engine.numberClassName}`}>
                        {engine.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-extrabold ${engine.nameClassName}`}>{engine.name}</p>
                        <p className="text-[10px] font-semibold text-slate-500">{engine.provider}</p>
                      </div>
                      {engine.badge && (
                        <span className="rounded-full bg-amber-200/80 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-amber-900">
                          {engine.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2.5 flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-cyan-500" />
                  <h3 className="text-[12px] font-black uppercase tracking-[0.12em] text-slate-800">
                    Estimasi waktu proses
                  </h3>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {processingTimes.map(({ resolution, time }, index) => (
                    <div
                      key={resolution}
                      className={`flex items-center justify-between gap-4 px-3.5 py-2.5 ${index > 0 ? 'border-t border-slate-100' : ''}`}
                    >
                      <span className="font-mono text-[12px] font-black tracking-wide text-slate-500">{resolution}</span>
                      <span className="text-[13px] font-extrabold text-slate-800">{time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-center text-[10px] font-semibold text-slate-400">
                Gunakan ranking ini sebagai titik awal saat memilih engine.
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
