

export const ZenLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`flex items-center justify-center rounded-xl overflow-hidden shadow-md shadow-primary/20 ${className}`}>
    <img src="/logo-icon.png" alt="ZenStudio Logo" className="w-full h-full object-cover" />
  </div>
);
