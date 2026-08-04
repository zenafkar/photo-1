import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Sparkles, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export default function PromptFeatureHighlight() {
  const fullPrompt = "Professional commercial product photography of a serum bottle on a dark marble pedestal, fine gold dust particles floating gracefully, dramatic cinematic rim light, crisp reflections, moody elegant dark backdrop, ultra-detailed 8k resolution...";
  const [displayedText, setDisplayedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isGenerating) {
      let i = 0;
      setDisplayedText("");
      const typeWriter = setInterval(() => {
        if (i < fullPrompt.length) {
          setDisplayedText(fullPrompt.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeWriter);
          setTimeout(() => setIsGenerating(false), 4000);
        }
      }, 25);
      return () => clearInterval(typeWriter);
    } else {
      timeout = setTimeout(() => {
        setIsGenerating(true);
      }, 1500);
    }
    return () => clearTimeout(timeout);
  }, [isGenerating, fullPrompt]);

  return (
    <section className="py-20 bg-background border-y border-surface-border overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Text Description */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-surface-border text-xs font-bold text-primary mb-6">
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Prompt Studio</span>
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-text tracking-tight mb-6 leading-tight">
                Bebas Pusing Mikir{" "}
                <br />
                <motion.span
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 via-secondary to-primary bg-[length:200%_auto] inline-block"
                >
                  Prompt Foto.
                </motion.span>
              </h2>
              <p className="text-lg text-text-muted font-medium mb-8 leading-relaxed">
                Tidak punya ide desain atau bingung menyusun kata-kata prompt? Jangan khawatir. Biarkan AI kami yang meracik setingan pencahayaan studio profesional secara otomatis untuk Anda.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "Pilih dari puluhan preset siap pakai untuk marketplace",
                  "1-Klik kustomisasi latar, efek, dan lighting studio",
                  "Hasil prompt yang dioptimalkan untuk AI rendering 4K"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-secondary shrink-0" />
                    <span className="text-text font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Interactive Bento / Visual Demo */}
            <div className="order-1 lg:order-2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl transform rotate-3 blur-2xl"></div>

              <div className="bg-surface/60 backdrop-blur-sm border border-surface-border rounded-3xl shadow-2xl p-6 md:p-8 relative z-10 overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
                {/* Header mock */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-border">
                  <div className="flex items-center gap-2 text-text font-bold">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Parameter Model</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-surface-border"></div>
                    <div className="w-3 h-3 rounded-full bg-surface-border"></div>
                    <div className="w-3 h-3 rounded-full bg-surface-border"></div>
                  </div>
                </div>

                {/* Mock textarea */}
                <div className="space-y-3 mb-6 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-text-muted">Prompt <span className="text-primary">*</span></label>

                    {/* The Magic Button Simulation */}
                    <motion.div
                      animate={isGenerating ? { scale: [1, 0.95, 1] } : {}}
                      transition={{ duration: 0.5 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors duration-300 ${isGenerating ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-primary text-white shadow-[0_0_15px_rgba(212,69,42,0.3)]'}`}
                    >
                      <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-bounce' : ''}`} />
                      <span>{isGenerating ? 'Merakit Prompt...' : 'Auto Generate Prompt'}</span>
                    </motion.div>
                  </div>

                  <div className="w-full h-40 p-4 bg-black/50 border border-surface-border rounded-xl text-sm font-medium shadow-inner relative overflow-hidden flex flex-col">
                    {!isGenerating && displayedText === "" ? (
                      <span className="text-text-muted">Deskripsikan foto yang Anda inginkan...</span>
                    ) : (
                      <div className="relative z-10 text-secondary leading-relaxed font-mono text-[13px]">
                        <span className="text-primary mr-2">&gt;</span>
                        {displayedText}
                        {isGenerating && <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-4 bg-secondary ml-1 translate-y-1"></motion.span>}
                      </div>
                    )}

                    {/* Glowing effect inside textarea when generating */}
                    {isGenerating && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/10 to-transparent w-[200%] animate-[shimmer_2s_infinite] pointer-events-none" style={{ transform: 'skewX(-20deg)' }}></div>
                    )}
                  </div>
                </div>

                {/* Generate Button Mock */}
                <div className="w-full py-3.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 transition-colors text-primary text-center rounded-xl font-bold text-sm cursor-not-allowed">
                  Mulai Generate Foto
                </div>
              </div>
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
