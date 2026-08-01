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
          setTimeout(() => setIsGenerating(false), 4000); // Wait 4s before clearing
        }
      }, 25);
      return () => clearInterval(typeWriter);
    } else {
      // Loop it automatically after a short delay
      timeout = setTimeout(() => {
        setIsGenerating(true);
      }, 1500);
    }
    
    return () => clearTimeout(timeout);
  }, [isGenerating, fullPrompt]);

  return (
    <section className="py-20 bg-slate-50 border-y border-slate-200 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-indigo-50/50 to-transparent pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Text Description */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-xs font-bold text-indigo-700 mb-6 shadow-sm">
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Prompt Studio</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
                Bebas Pusing Mikir <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                  Prompt Foto.
                </span>
              </h2>
              <p className="text-lg text-slate-600 font-medium mb-8 leading-relaxed">
                Tidak punya ide desain atau bingung menyusun kata-kata prompt? Jangan khawatir. Biarkan AI kami yang meracik setingan pencahayaan studio profesional secara otomatis untuk Anda.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Pilih dari puluhan preset siap pakai untuk marketplace",
                  "1-Klik kustomisasi latar, efek, dan lighting studio",
                  "Hasil prompt yang dioptimalkan untuk AI rendering 4K"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    <span className="text-slate-700 font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Interactive Bento / Visual Demo */}
            <div className="order-1 lg:order-2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 rounded-3xl transform rotate-3 blur-2xl"></div>
              
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 relative z-10 overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
                {/* Header mock */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span>Parameter Model</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  </div>
                </div>
                
                {/* Mock textarea */}
                <div className="space-y-3 mb-6 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">Prompt <span className="text-red-500">*</span></label>
                    
                    {/* The Magic Button Simulation */}
                    <motion.div 
                      animate={isGenerating ? { scale: [1, 0.95, 1], filter: ["hue-rotate(0deg)", "hue-rotate(45deg)", "hue-rotate(0deg)"] } : {}}
                      transition={{ duration: 0.5 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors duration-300 ${isGenerating ? 'bg-indigo-100 text-indigo-500 border border-indigo-200' : 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/30'}`}
                    >
                      <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-bounce' : ''}`} />
                      <span>{isGenerating ? 'Merakit Prompt...' : 'Auto Generate Prompt'}</span>
                    </motion.div>
                  </div>
                  
                  <div className="w-full h-40 p-4 bg-slate-50 border border-indigo-100 rounded-xl text-sm font-medium text-slate-700 shadow-inner relative overflow-hidden flex flex-col">
                    {!isGenerating && displayedText === "" ? (
                      <span className="text-slate-400">Deskripsikan foto yang Anda inginkan...</span>
                    ) : (
                      <div className="relative z-10 text-indigo-900 leading-relaxed font-mono text-[13px]">
                        {displayedText}
                        {isGenerating && <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-4 bg-indigo-500 ml-1 translate-y-1"></motion.span>}
                      </div>
                    )}
                    
                    {/* Glowing effect inside textarea when generating */}
                    {isGenerating && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent w-[200%] animate-[shimmer_2s_infinite] pointer-events-none" style={{ transform: 'skewX(-20deg)' }}></div>
                    )}
                  </div>
                </div>
                
                {/* Generate Button Mock */}
                <div className="w-full py-3.5 bg-slate-900 text-slate-300 text-center rounded-xl font-bold text-sm">
                  Mulai Generate Foto
                </div>
                
                {/* Custom CSS for Shimmer inside JSX */}
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes shimmer {
                    0% { transform: translateX(-150%) skewX(-20deg); }
                    100% { transform: translateX(100%) skewX(-20deg); }
                  }
                `}} />
              </div>
            </div>
            
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
