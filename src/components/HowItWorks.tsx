import { UploadCloud, ShieldCheck, Download, Cpu, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

const pipelineSteps = [
  {
    id: '01',
    phase: 'RAW INPUT',
    title: 'Ambil Foto Seadanya',
    desc: 'Tidak perlu studio mahal. Gunakan smartphone Anda dengan pencahayaan seadanya. Tanpa perlu green screen atau background polos.',
    icon: UploadCloud,
    accent: 'text-landing-text',
    glow: 'bg-landing-surface',
    image: '/fanta-before.jpg'
  },
  {
    id: '02',
    phase: 'INTEGRITY LOCK',
    title: 'Analisis & Isolasi AI',
    desc: 'Engine kami memindai siluet, tekstur, dan tulisan merek. Produk Anda diisolasi hingga level piksel terdalam tanpa distorsi sekecil apapun.',
    icon: ShieldCheck,
    accent: 'text-landing-secondary',
    glow: 'bg-landing-secondary/20 shadow-[0_0_30px_rgba(61,139,125,0.4)]',
    visual: 'geometry'
  },
  {
    id: '03',
    phase: 'STUDIO RENDER',
    title: 'Output 4K Siap Tayang',
    desc: 'Dalam 30 detik, dapatkan hasil dengan pencahayaan studio, bayangan realistis, dan resolusi tinggi yang langsung siap diunggah ke e-commerce.',
    icon: Download,
    accent: 'text-landing-primary',
    glow: 'bg-landing-primary/20 shadow-[0_0_30px_rgba(212,69,42,0.4)]',
    image: '/fanta-after.jpg'
  }
];

const HowItWorks = () => {
  return (
    <section data-component="how-it-works" id="cara-kerja" className="py-24 lg:py-32 bg-landing-bg relative overflow-hidden border-t border-landing-border">
      
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1000px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-20 lg:mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-none border border-landing-border bg-landing-surface/50 text-[11px] font-mono tracking-widest text-landing-text-muted uppercase mb-8"
          >
            <Cpu className="w-3.5 h-3.5 text-landing-secondary" />
            <span>Processing Pipeline</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-landing-display text-4xl sm:text-5xl lg:text-6xl font-light text-landing-text mb-6 tracking-tight max-w-3xl mx-auto leading-[1.1]"
          >
            Dari <span className="italic text-landing-text-muted">Kamera HP</span> ke <br className="hidden sm:block" />
            <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-landing-primary to-landing-secondary">Resolusi Studio</span> dalam 30 Detik.
          </motion.h2>
        </div>

        {/* The Pipeline */}
        <div className="relative">
          {/* Central Vertical Line (The Fiber Optic) */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-landing-border to-transparent" />
          
          {/* Pipeline glowing indicator */}
          <motion.div 
            className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[30%] bg-gradient-to-b from-transparent via-landing-primary to-transparent blur-[2px]"
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 5, ease: "linear", repeat: Infinity }}
          />

          <div className="space-y-16 lg:space-y-32">
            {pipelineSteps.map((step, idx) => {
              const isEven = idx % 2 === 1;
              const IconComp = step.icon;
              
              return (
                <div key={step.id} className={`relative flex flex-col ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 lg:gap-16`}>
                  
                  {/* Node Connector (Desktop) */}
                  <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-landing-bg border-2 border-landing-border rounded-full items-center justify-center z-20">
                    <div className="w-2 h-2 rounded-full bg-landing-text-muted" />
                  </div>

                  {/* Text Content */}
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex-1 w-full lg:w-1/2"
                  >
                    <div className={`flex flex-col ${isEven ? 'lg:items-start lg:text-left' : 'lg:items-end lg:text-right'} items-start text-left`}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-mono tracking-widest text-landing-text-muted px-2 py-1 border border-landing-border rounded bg-landing-surface/30">
                          SEQ: {step.id}
                        </span>
                        <span className={`text-[10px] font-mono tracking-widest ${step.accent}`}>
                          // {step.phase}
                        </span>
                      </div>
                      
                      <h3 className="font-landing-display text-2xl sm:text-3xl font-medium text-landing-text mb-4">
                        {step.title}
                      </h3>
                      <p className="text-landing-text-muted text-base sm:text-lg font-light leading-relaxed max-w-md">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>

                  {/* Visual Content */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex-1 w-full lg:w-1/2 flex justify-center"
                  >
                    <div className="relative w-full max-w-[320px] aspect-square rounded-2xl border border-landing-border bg-landing-surface/20 overflow-hidden group">
                      
                      {/* Corner Accents */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-landing-text-muted/50 z-20" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-landing-text-muted/50 z-20" />
                      
                      {step.image ? (
                        <div className="absolute inset-0 p-4">
                          <img src={step.image} alt={step.title} className="w-full h-full object-cover rounded-xl filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 p-4 flex items-center justify-center">
                          <div className="relative w-3/4 h-3/4 border border-dashed border-landing-secondary/40 rounded-xl flex items-center justify-center bg-landing-secondary/5">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-landing-bg px-2 text-[8px] font-mono text-landing-secondary">TARGET ACQUIRED</div>
                            {/* Scanning line */}
                            <motion.div 
                              className="absolute left-0 right-0 h-[1px] bg-landing-secondary/50 shadow-[0_0_10px_#3D8B7D]"
                              animate={{ top: ['0%', '100%', '0%'] }}
                              transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                            />
                            <ShieldCheck className="w-16 h-16 text-landing-secondary/30" />
                          </div>
                        </div>
                      )}

                      {/* Icon Badge Overlay */}
                      <div className="absolute bottom-4 right-4 z-30">
                        <div className={`p-3 rounded-xl border border-landing-border backdrop-blur-md flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${step.glow}`}>
                          <IconComp className={`w-5 h-5 ${step.accent}`} />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-20 flex justify-center lg:hidden">
            <div className="animate-bounce p-3 rounded-full border border-landing-border bg-landing-surface/30">
                <ArrowDown className="w-5 h-5 text-landing-text-muted" />
            </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
