import { lazy, Suspense } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import FeatureShowcase from '../components/FeatureShowcase';
import GoToTop from '../components/GoToTop';

// Lazy load below-fold sections
const IntegrityEngine = lazy(() => import('../components/IntegrityEngine'));
const SocialProof = lazy(() => import('../components/SocialProof'));
const PricingSection = lazy(() => import('../components/PricingSection'));
const FAQ = lazy(() => import('../components/FAQ'));
const Footer = lazy(() => import('../components/Footer'));

// Placeholder for lazy sections — matches typical section height to reduce CLS
const SectionPlaceholder = () => (
  <div className="w-full py-16 md:py-24 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

export default function LandingPage() {
  return (
    <div className="theme-landing min-h-[100dvh] bg-landing-bg selection:bg-landing-primary/30 selection:text-landing-text text-landing-text font-sans antialiased overflow-x-hidden">
      <Navbar />
      <main>
        {/* Above-fold: sync-loaded for instant first paint */}
        <Hero />
        <HowItWorks />
        <FeatureShowcase />

        {/* Below-fold: lazy-loaded with individual Suspense boundaries */}
        <Suspense fallback={<SectionPlaceholder />}>
          <IntegrityEngine />
        </Suspense>

        <Suspense fallback={<SectionPlaceholder />}>
          <SocialProof />
        </Suspense>

        <Suspense fallback={<SectionPlaceholder />}>
          <PricingSection />
        </Suspense>

        <Suspense fallback={<SectionPlaceholder />}>
          <FAQ />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>

      <GoToTop />
    </div>
  );
}
