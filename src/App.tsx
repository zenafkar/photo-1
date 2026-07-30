import Navbar from './components/Navbar';
import Hero from './components/Hero';
import IntegrityEngine from './components/IntegrityEngine';
import InteractiveSandbox from './components/InteractiveSandbox';
import MarketplacePresets from './components/MarketplacePresets';
import CompetitiveComparison from './components/CompetitiveComparison';
import WorkflowSteps from './components/WorkflowSteps';
import PricingSection from './components/PricingSection';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-background selection:bg-secondary/20 selection:text-primary text-text font-sans antialiased overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <IntegrityEngine />
        <InteractiveSandbox />
        <WorkflowSteps />
        <MarketplacePresets />
        <CompetitiveComparison />
        <Testimonials />
        <PricingSection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default App;
