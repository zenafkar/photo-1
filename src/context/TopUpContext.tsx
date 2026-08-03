import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { TopUpModal } from "../components/TopUpModal";

interface TopUpContextValue {
  openTopUp: (packageId?: string) => void;
  closeTopUp: () => void;
}

const TopUpContext = createContext<TopUpContextValue | null>(null);

export function useTopUp(): TopUpContextValue {
  const ctx = useContext(TopUpContext);
  if (!ctx) {
    throw new Error("useTopUp must be used within a TopUpProvider");
  }
  return ctx;
}

export function TopUpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultPackageId, setDefaultPackageId] = useState<string | undefined>(undefined);

  const openTopUp = useCallback((packageId?: string) => {
    setDefaultPackageId(packageId);
    setIsOpen(true);
  }, []);

  const closeTopUp = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <TopUpContext.Provider value={{ openTopUp, closeTopUp }}>
      {children}
      <TopUpModal
        isOpen={isOpen}
        onClose={closeTopUp}
        defaultPackageId={defaultPackageId}
      />
    </TopUpContext.Provider>
  );
}
