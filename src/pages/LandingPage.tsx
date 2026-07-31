import { lazy, Suspense } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import { ScrollReveal } from '../components/ScrollReveal';
import GoToTop from '../components/GoToTop';

// Lazy load komponen yang ada di bawah (below the fold)
const IntegrityEngine = lazy(() => import('../components/IntegrityEngine'));
const InteractiveSandbox = lazy(() => import('../components/InteractiveSandbox'));
const MarketplacePresets = lazy(() => import('../components/MarketplacePresets'));
const CompetitiveComparison = lazy(() => import('../components/CompetitiveComparison'));
const WorkflowSteps = lazy(() => import('../components/WorkflowSteps'));
const PricingSection = lazy(() => import('../components/PricingSection'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const FAQ = lazy(() => import('../components/FAQ'));
const Footer = lazy(() => import('../components/Footer'));

// Fallback skeleton sederhana untuk komponen yang sedang di-lazy load
const SectionLoader = () => (
  <div className="w-full h-32 flex items-center justify-center opacity-50">
    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-secondary/20 selection:text-primary text-text font-sans antialiased overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        
        {/* Suspense wrapper untuk semua komponen lazy */}
        <Suspense fallback={<SectionLoader />}>
          <ScrollReveal><IntegrityEngine /></ScrollReveal>
          <ScrollReveal><InteractiveSandbox /></ScrollReveal>
          <WorkflowSteps />
          <ScrollReveal><MarketplacePresets /></ScrollReveal>
          <ScrollReveal><CompetitiveComparison /></ScrollReveal>
          <ScrollReveal><Testimonials /></ScrollReveal>
          <ScrollReveal><PricingSection /></ScrollReveal>
          <ScrollReveal><FAQ /></ScrollReveal>
        </Suspense>
      </main>
      
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      
      <GoToTop />
    </div>
  );
}
