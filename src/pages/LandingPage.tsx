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

// Light placeholder for lazy sections
const SectionPlaceholder = () => (
  <div className="w-full h-32 bg-stone-100/50" />
);

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-white selection:bg-indigo-100 selection:text-indigo-700 text-stone-900 antialiased overflow-x-hidden">
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
