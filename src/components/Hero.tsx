import {
  ArrowRight,
  Camera,
  Sparkles,
  Zap,
} from 'lucide-react';
import { StaggerContainer, StaggerItem } from './ScrollReveal';
import { SignedOut, SignedIn, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const HeroInteractiveDemo = () => {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [interacted, setInteracted] = useState(false);
  const [activeSet, setActiveSet] = useState<0 | 1>(0);

  useEffect(() => {
    if (interacted) return;
    const cycle = () => {
      setStep(0);
      setTimeout(() => setStep(1), 1500);
      setTimeout(() => setStep(2), 3500);
    };
    cycle();
    const interval = setInterval(cycle, 7000);
    return () => clearInterval(interval);
  }, [interacted]);

  const handleGenerateClick = () => {
    setInteracted(true);
    if (step === 2 || step === 1) {
      setStep(0);
      setActiveSet(prev => prev === 0 ? 1 : 0);
      setTimeout(() => setStep(1), 300);
      setTimeout(() => setStep(2), 2300);
    } else {
      setStep(1);
      setTimeout(() => setStep(2), 2000);
    }
  };

  const images = [
    { before: '/mystic-before.jpg', after: '/mystic-after.jpg' },
    { before: '/fanta-before.jpg', after: '/fanta-after.jpg' }
  ];

  return (
    <div className="relative w-full max-w-[440px] mx-auto group">
      {/* High-End Studio Darkroom Frame */}
      <div className="relative aspect-[4/5] bg-[#0A0A0C] border border-landing-border rounded-lg overflow-hidden shadow-2xl">
        {/* Before Image (Raw) */}
        <AnimatePresence mode="wait">
          <motion.img
            key={`before-${activeSet}`}
            src={images[activeSet].before}
            alt="Raw photo"
            className="absolute inset-0 w-full h-full object-cover filter grayscale-[30%] contrast-[0.8] brightness-[0.7]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        </AnimatePresence>

        {/* After Image (Studio Render) */}
        <motion.div
          className="absolute inset-0 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: step === 2 ? 1 : 0 }}
          transition={{ duration: 1.2, ease: "circOut" }}
        >
          <img src={images[activeSet].after} alt="Studio Render" className="w-full h-full object-cover" />
        </motion.div>

        {/* Studio Lighting Exposure Effect (Scanner) */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div
              className="absolute top-0 left-0 right-0 h-[3px] bg-landing-primary z-20 shadow-[0_0_20px_#D926A9,0_0_40px_#D926A9]"
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: [0, 600], opacity: [0, 1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-b from-landing-primary/40 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Indicators */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
          <span className={`flex items-center gap-2 text-[10px] font-mono tracking-widest px-3 py-1.5 rounded-full uppercase border backdrop-blur-md transition-all ${
            step === 2 
              ? 'bg-landing-primary/20 text-landing-primary border-landing-primary/50' 
              : 'bg-black/50 text-landing-text-muted border-landing-border'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${step === 2 ? 'bg-landing-primary animate-pulse' : 'bg-landing-text-muted'}`} />
            {step === 2 ? 'Studio Render 4K' : step === 1 ? 'Exposing...' : 'Raw Image'}
          </span>
        </div>

        {/* Interactive Trigger */}
        <button 
          onClick={handleGenerateClick}
          disabled={step === 1}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-landing-surface/80 hover:bg-landing-primary text-landing-text text-sm font-medium px-6 py-3 rounded-full backdrop-blur-lg border border-landing-border hover:border-landing-primary transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
        >
          {step === 1 ? <Zap className="w-4 h-4 text-landing-primary animate-pulse" /> : <Camera className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />}
          {step === 1 ? 'Processing...' : 'Develop Photo'}
        </button>
      </div>

      {/* Decorative framing elements */}
      <div className="absolute -top-3 -left-3 w-6 h-6 border-t border-l border-landing-border" />
      <div className="absolute -top-3 -right-3 w-6 h-6 border-t border-r border-landing-border" />
      <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b border-l border-landing-border" />
      <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b border-r border-landing-border" />
    </div>
  );
};

const Hero = () => {
  const { openSignUp } = useClerk();

  return (
    <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-landing-bg">
      {/* Studio Lighting Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-landing-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-landing-secondary/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Typography & Narrative */}
          <StaggerContainer className="max-w-2xl">
            <StaggerItem>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-landing-border bg-landing-surface/50 text-[11px] font-mono tracking-widest text-landing-text-muted uppercase mb-8">
                <span className="w-2 h-2 rounded-full bg-landing-primary animate-pulse" />
                Next-Gen AI Photography
              </div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="font-landing-display text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight text-landing-text mb-6 leading-[1.1]">
                Your Products.<br />
                <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-landing-primary to-landing-secondary">
                  Exposed Perfectly.
                </span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-lg text-landing-text-muted mb-10 leading-relaxed max-w-lg font-light">
                Step into the digital darkroom. We transform raw, unedited mobile photos into pristine, marketplace-ready studio assets with absolute color and shape integrity.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-wrap items-center gap-4">
                <SignedOut>
                  <button
                    onClick={() => openSignUp ? openSignUp({ fallbackRedirectUrl: '/studio' }) : null}
                    className="px-8 py-4 bg-landing-text text-landing-bg hover:bg-landing-text/90 rounded-none font-medium transition-all flex items-center gap-3 group"
                  >
                    Start Developing
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignedOut>
                <SignedIn>
                  <Link 
                    to="/studio" 
                    className="px-8 py-4 bg-landing-text text-landing-bg hover:bg-landing-text/90 rounded-none font-medium transition-all flex items-center gap-3 group"
                  >
                    Enter Studio
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </SignedIn>
                
                <div className="flex items-center gap-3 px-4 py-4 border border-landing-border text-sm text-landing-text-muted font-mono uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-landing-primary" />
                  3 Free Exposures
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* Interactive Darkroom */}
          <div className="w-full flex justify-center lg:justify-end">
            <HeroInteractiveDemo />
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
