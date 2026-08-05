import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Wand2, Share2 } from 'lucide-react';
import InteractiveSandbox from './InteractiveSandbox';
import PromptFeatureHighlight from './PromptFeatureHighlight';
import MarketplacePresets from './MarketplacePresets';

const tabs = [
  { id: 'engines', label: 'AI Engines', shortLabel: 'Engines', icon: Sliders, desc: 'Bandingkan hasil AI' },
  { id: 'prompt', label: 'Smart Prompt', shortLabel: 'Prompt', icon: Wand2, desc: 'AI rakit prompt otomatis' },
  { id: 'export', label: 'Marketplace Export', shortLabel: 'Export', icon: Share2, desc: 'Auto-resize semua platform' },
];

const FeatureShowcase = () => {
  const [activeTab, setActiveTab] = useState('engines');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleTabKeydown = useCallback((e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      setActiveTab(tabs[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  }, []);

  return (
    <section data-component="features" id="fitur" className="py-16 md:py-24 bg-background border-t border-surface-border relative overflow-hidden text-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-surface-border text-xs font-semibold text-primary mb-5 mx-auto">
            <Wand2 className="w-3.5 h-3.5" />
            <span>FITUR UNGGULAN</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-text mb-4 tracking-tight">
            Teknologi AI untuk Foto Produk
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Pilih engine AI, atur prompt otomatis, dan ekspor ke semua marketplace — semua dalam satu tempat.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div role="tablist" aria-label="Fitur unggulan" className="inline-flex bg-surface border border-surface-border rounded-2xl p-1.5">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current[index] = el; }}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeydown(e, index)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-background text-primary border border-surface-border'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            tabIndex={0}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'engines' && <InteractiveSandbox />}
            {activeTab === 'prompt' && <PromptFeatureHighlight />}
            {activeTab === 'export' && <MarketplacePresets />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default FeatureShowcase;
