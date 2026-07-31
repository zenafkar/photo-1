import { UploadCloud, Sparkles, Download, Workflow, Cpu } from 'lucide-react';
import { motion, Variants, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const steps = [
  { title: 'Upload Foto HP', desc: 'Foto produk Anda dengan pencahayaan seadanya. Tidak perlu background polos.', icon: UploadCloud },
  { title: 'AI Neural Engine', desc: 'Product Integrity Engine langsung mengenali dan mengunci produk Anda agar tidak berubah.', icon: Cpu },
  { title: 'Render 4K', desc: 'Tentukan kategori dan vibe background yang sesuai dengan brand Anda.', icon: Sparkles },
  { title: 'Marketplace Ready', desc: 'Dapatkan 4 variasi foto profesional dalam hitungan detik. Siap upload.', icon: Download }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

const WorkflowSteps = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="py-16 md:py-24 bg-slate-950 relative overflow-hidden border-t border-slate-800/80">
      {/* Background Glows Optimized */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(8,145,178,0.15)_0%,transparent_70%)] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(79,70,229,0.15)_0%,transparent_70%)] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-xs font-mono text-indigo-300 mb-6 backdrop-blur-md mx-auto">
            <Workflow className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI PROCESSING PIPELINE</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight">
            <motion.span 
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, ease: "linear", repeat: Infinity }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-cyan-400 bg-[length:200%_auto]"
            >
              Cara Kerja Super Mudah
            </motion.span>
          </h2>
          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">
            Ubah foto seadanya menjadi mahakarya studio profesional hanya dengan 4 langkah instan.
          </p>
        </motion.div>
        
        <motion.div 
          ref={containerRef}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          className="flex flex-col md:grid md:grid-cols-4 gap-10 md:gap-8 relative"
        >
          {/* Animated connection line (Desktop) */}
          <motion.div 
            style={{ scaleX: lineScaleX }}
            className="hidden md:block absolute top-12 left-[12%] right-[12%] h-1 bg-gradient-to-r from-cyan-900 via-indigo-500 to-cyan-900 rounded-full origin-left z-0 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
          />

          {/* Animated connection line (Mobile) */}
          <motion.div 
            style={{ scaleY: lineScaleY }}
            className="md:hidden absolute top-8 bottom-12 left-[38px] w-1 bg-gradient-to-b from-cyan-900 via-indigo-500 to-cyan-900 rounded-full origin-top z-0 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
          />
          
          {steps.map((step, i) => (
            <motion.div key={i} variants={itemVariants} className="relative flex flex-row md:flex-col items-start md:items-center text-left md:text-center group z-10 gap-6 md:gap-0">
              <div className="relative mb-0 md:mb-8 shrink-0">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-cyan-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] rotate-3 group-hover:rotate-0 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.5)] group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center justify-center relative z-10 transition-all duration-300">
                  <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl md:rounded-[2rem] pointer-events-none" />
                  <step.icon className="w-8 h-8 md:w-10 md:h-10 text-cyan-400 group-hover:scale-110 group-hover:text-cyan-300 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                </div>
                
                <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-600 flex items-center justify-center font-bold text-white text-xs md:text-sm shadow-[0_0_15px_rgba(6,182,212,0.5)] ring-4 ring-slate-950 z-20 group-hover:scale-110 transition-transform duration-300">
                  {i + 1}
                </div>
              </div>
              <div className="pt-2 md:pt-0">
                <h3 className="text-lg md:text-xl font-extrabold text-slate-100 mb-2 md:mb-3 group-hover:text-cyan-400 transition-colors">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium px-0 md:px-2">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WorkflowSteps;

