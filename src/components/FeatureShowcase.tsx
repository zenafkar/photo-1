import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Wand2, Share2 } from 'lucide-react';
import InteractiveSandbox from './InteractiveSandbox';
import PromptFeatureHighlight from './PromptFeatureHighlight';
import MarketplacePresets from './MarketplacePresets';

const tabs = [
  { id: 'engines', label: 'AI Engines', icon: Sliders, desc: 'Bandingkan hasil AI' },
  { id: 'prompt', label: 'Smart Prompt', icon: Wand2, desc: 'AI rakit prompt otomatis' },
  { id: 'export', label: 'Marketplace Export', icon: Share2, desc: 'Auto-resize semua platform' },
];

const FeatureShowcase = () => {
  const [activeTab, setActiveTab] = useState('engines');

  return (
    <section id="fitur" className="py-16 md:py-24 bg-white border-t border-stone-200 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(79,70,229,0.04)_0%,transparent_70%)] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-5 mx-auto">
            <Wand2 className="w-3.5 h-3.5" />
            <span>FITUR UNGGULAN</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-stone-900 mb-4 tracking-tight">
            Teknologi AI untuk Foto Produk
          </h2>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            Pilih engine AI, atur prompt otomatis, dan ekspor ke semua marketplace — semua dalam satu tempat.
          </p>
        </div>

        {/* Tab Bar */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-stone-100 rounded-2xl p-1.5 border border-stone-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-sm border border-stone-200'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-500' : ''}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
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
