

export const ZenLogo = ({ className = "w-7 h-7" }: { className?: string }) => (
  <div className={`flex items-center justify-center bg-white rounded-lg overflow-hidden ${className}`}>
    <img src="/logo-icon.png" alt="ZenStudio Logo" className="w-full h-full object-contain scale-[2.8]" />
  </div>
);
