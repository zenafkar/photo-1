import { motion } from 'framer-motion';
import { Sliders, Wand2, Share2, Image as ImageIcon } from 'lucide-react';
import { StaggerContainer, StaggerItem } from './ScrollReveal';

const features = [
  {
    icon: Sliders,
    title: 'Pro AI Engines',
    description: 'Toggle between Nano Banana Pro and GPT Image 1.5 to find the perfect lighting and texture for your product category.',
  },
  {
    icon: Wand2,
    title: 'Smart Prompt Builder',
    description: 'No engineering required. Just select your vibe (e.g. Minimalist, Cinematic, Natural) and our engine handles the complex prompting.',
  },
  {
    icon: Share2,
    title: 'Marketplace Ready',
    description: 'Auto-resizes and optimizes the final export for Shopee, Tokopedia, and TikTok Shop requirements instantly.',
  }
];

const FeatureShowcase = () => {
  return (
    <section className="py-24 lg:py-32 bg-landing-bg border-t border-landing-border relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        <StaggerContainer className="text-center mb-16 lg:mb-24">
          <StaggerItem>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-landing-border bg-landing-surface/50 text-[11px] font-mono tracking-widest text-landing-text-muted uppercase mb-6">
              <ImageIcon className="w-3.5 h-3.5 text-landing-primary" />
              <span>The Digital Studio</span>
            </div>
          </StaggerItem>
          <StaggerItem>
            <h2 className="font-landing-display text-4xl sm:text-5xl lg:text-6xl font-light text-landing-text mb-6 tracking-tight">
              Professional Tools.<br/>
              <span className="text-landing-primary">Zero Learning Curve.</span>
            </h2>
          </StaggerItem>
          <StaggerItem>
            <p className="text-lg text-landing-text-muted max-w-2xl mx-auto font-light leading-relaxed">
              We've abstracted away the complexity of AI image generation. What's left is a streamlined interface designed specifically for e-commerce sellers who need high-converting photos, fast.
            </p>
          </StaggerItem>
        </StaggerContainer>

        {/* Studio Interface Mockup */}
        <div className="relative mx-auto max-w-5xl mb-24">
          <StaggerContainer>
            <StaggerItem>
              <div className="relative rounded-2xl border border-landing-border bg-landing-surface shadow-2xl overflow-hidden">
                {/* Mac OS like header */}
                <div className="h-12 border-b border-landing-border flex items-center px-4 gap-2 bg-landing-bg/50">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                  <div className="mx-auto px-4 py-1 rounded-md bg-landing-bg border border-landing-border text-[10px] font-mono text-landing-text-muted">
                    zenstudio.my.id/studio
                  </div>
                </div>
                {/* Mockup Body */}
                <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Sidebar mockup */}
                  <div className="col-span-1 space-y-4">
                    <div className="h-40 rounded-xl bg-landing-bg border border-landing-border flex items-center justify-center relative overflow-hidden">
                       <img src="/mystic-before.jpg" alt="raw" className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale" />
                       <div className="relative z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-mono text-landing-text uppercase border border-landing-border">Input</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-1/3 bg-landing-border rounded-full" />
                      <div className="h-8 w-full bg-landing-bg border border-landing-border rounded-md" />
                      <div className="h-8 w-full bg-landing-bg border border-landing-border rounded-md" />
                    </div>
                    <div className="pt-4">
                      <div className="h-10 w-full bg-landing-primary rounded-md flex items-center justify-center text-xs font-bold text-white uppercase tracking-wide">
                        Generate
                      </div>
                    </div>
                  </div>
                  {/* Main Canvas mockup */}
                  <div className="col-span-1 md:col-span-2 h-full min-h-[300px] rounded-xl bg-[#0A0A0C] border border-landing-border relative overflow-hidden flex items-center justify-center shadow-inner">
                     <img src="/mystic-after.jpg" alt="processed" className="absolute inset-0 w-full h-full object-cover" />
                     <div className="absolute bottom-4 right-4 flex gap-2">
                       <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-landing-border flex items-center justify-center">
                         <Share2 className="w-4 h-4 text-landing-text" />
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
          
          {/* Ambient glow behind mockup */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[400px] bg-landing-secondary/20 blur-[60px] md:blur-[100px] transform-gpu -z-10" />
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 sm:p-8 rounded-2xl bg-landing-surface/30 border border-landing-border hover:bg-landing-surface/60 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-landing-primary/10 border border-landing-primary/20 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-landing-primary" />
                </div>
                <h3 className="text-xl font-medium text-landing-text mb-3">{feature.title}</h3>
                <p className="text-landing-text-muted text-sm leading-relaxed font-light">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FeatureShowcase;
