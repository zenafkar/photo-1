import { lazy, Suspense } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import IntegrityEngine from '../components/IntegrityEngine';
import InteractiveSandbox from '../components/InteractiveSandbox';
import { ScrollReveal } from '../components/ScrollReveal';
import GoToTop from '../components/GoToTop';

// Lazy load komponen yang letaknya jauh di bawah (below the fold)
const MarketplacePresets = lazy(() => import('../components/MarketplacePresets'));
const CompetitiveComparison = lazy(() => import('../components/CompetitiveComparison'));
const WorkflowSteps = lazy(() => import('../components/WorkflowSteps'));
const PricingSection = lazy(() => import('../components/PricingSection'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const FAQ = lazy(() => import('../components/FAQ'));
const Footer = lazy(() => import('../components/Footer'));

// Fallback skeleton yang tidak mencolok (tanpa spinner putar) agar lebih natural saat scrolling cepat
const SectionPlaceholder = () => (
  <div className="w-full h-40 bg-slate-950/20 animate-pulse"></div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-secondary/20 selection:text-primary text-text font-sans antialiased overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        
        {/* Komponen yang langsung terlihat / dekat atas di-load secara sinkron agar tidak ada jeda loading */}
        <ScrollReveal><IntegrityEngine /></ScrollReveal>
        <ScrollReveal><InteractiveSandbox /></ScrollReveal>
        
        {/* Komponen bawah di-lazy load dengan Suspense masing-masing agar tidak saling menunggu */}
        <Suspense fallback={<SectionPlaceholder />}>
          <WorkflowSteps />
        </Suspense>
        
        <Suspense fallback={<SectionPlaceholder />}>
          <ScrollReveal><MarketplacePresets /></ScrollReveal>
        </Suspense>
        
        <Suspense fallback={<SectionPlaceholder />}>
          <ScrollReveal><CompetitiveComparison /></ScrollReveal>
        </Suspense>
        
        <Suspense fallback={<SectionPlaceholder />}>
          <ScrollReveal><Testimonials /></ScrollReveal>
        </Suspense>
        
        <Suspense fallback={<SectionPlaceholder />}>
          <ScrollReveal><PricingSection /></ScrollReveal>
        </Suspense>
        
        <Suspense fallback={<SectionPlaceholder />}>
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
