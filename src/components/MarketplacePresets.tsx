const ShopeeTokopediaIcon = () => (
  <div className="flex items-center justify-center gap-3">
    <img 
      src="https://cdn.simpleicons.org/shopee/EE4D2D" 
      alt="Shopee" 
      className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-md transition-transform group-hover:scale-110" 
    />
    <img 
      src="https://cdn.worldvectorlogo.com/logos/tokopedia.svg" 
      alt="Tokopedia" 
      className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-md transition-transform group-hover:scale-110" 
    />
  </div>
);

const TikTokIcon = () => (
  <img 
    src="https://cdn.simpleicons.org/tiktok/000000" 
    alt="TikTok" 
    className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-lg transition-transform group-hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]" 
  />
);

const InstagramBrandIcon = () => (
  <img 
    src="https://cdn.simpleicons.org/instagram/E4405F" 
    alt="Instagram" 
    className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-lg transition-transform group-hover:scale-110" 
  />
);

const presets = [
  { name: 'Shopee / Tokopedia', aspect: '1:1', w: 200, h: 200, icon: ShopeeTokopediaIcon },
  { name: 'TikTok Shop / IG Story', aspect: '9:16', w: 130, h: 230, icon: TikTokIcon },
  { name: 'Instagram Feed', aspect: '4:5', w: 160, h: 200, icon: InstagramBrandIcon },
];

const MarketplacePresets = () => {
  return (
    <section className="py-12 md:py-16 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Marketplace Ready Export</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Satu klik untuk mendapatkan semua ukuran yang dibutuhkan untuk berbagai platform tanpa merusak komposisi gambar.</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-10 md:gap-14">
          {presets.map((preset) => (
            <div key={preset.name} className="flex flex-col items-center">
              <div 
                className="bg-slate-50 border-2 border-gray-200 shadow-sm rounded-[24px] relative overflow-hidden flex items-center justify-center mb-6 group hover:border-indigo-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ width: preset.w, height: preset.h }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/80 via-blue-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 p-4">
                  <preset.icon />
                </div>
              </div>
              <h4 className="text-slate-900 font-extrabold text-lg mb-1.5">{preset.name}</h4>
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full shadow-sm">
                {preset.aspect}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketplacePresets;
