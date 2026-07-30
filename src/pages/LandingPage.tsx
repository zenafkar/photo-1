import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import IntegrityEngine from '../components/IntegrityEngine';
import InteractiveSandbox from '../components/InteractiveSandbox';
import MarketplacePresets from '../components/MarketplacePresets';
import CompetitiveComparison from '../components/CompetitiveComparison';
import WorkflowSteps from '../components/WorkflowSteps';
import PricingSection from '../components/PricingSection';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import GoToTop from '../components/GoToTop';
import { ScrollReveal } from '../components/ScrollReveal';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-secondary/20 selection:text-primary text-text font-sans antialiased overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <ScrollReveal><IntegrityEngine /></ScrollReveal>
        <ScrollReveal><InteractiveSandbox /></ScrollReveal>
        <WorkflowSteps />
        <ScrollReveal><MarketplacePresets /></ScrollReveal>
        <ScrollReveal><CompetitiveComparison /></ScrollReveal>
        <ScrollReveal><Testimonials /></ScrollReveal>
        <ScrollReveal><PricingSection /></ScrollReveal>
        <ScrollReveal><FAQ /></ScrollReveal>
      </main>
      <Footer />
      <GoToTop />
    </div>
  );
}
