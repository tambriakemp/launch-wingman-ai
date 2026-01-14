import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type PinterestEnvironment = "production" | "sandbox";

interface PinterestEnvironmentContextValue {
  environment: PinterestEnvironment;
  setEnvironment: (env: PinterestEnvironment) => void;
}

const PinterestEnvironmentContext = createContext<PinterestEnvironmentContextValue | undefined>(undefined);

const STORAGE_KEY = "pinterest_environment";

export function PinterestEnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironmentState] = useState<PinterestEnvironment>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === "sandbox" ? "sandbox" : "production") as PinterestEnvironment;
  });

  const setEnvironment = (env: PinterestEnvironment) => {
    setEnvironmentState(env);
    localStorage.setItem(STORAGE_KEY, env);
  };

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setEnvironmentState(e.newValue as PinterestEnvironment);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <PinterestEnvironmentContext.Provider value={{ environment, setEnvironment }}>
      {children}
    </PinterestEnvironmentContext.Provider>
  );
}

export function usePinterestEnvironment() {
  const context = useContext(PinterestEnvironmentContext);
  if (!context) {
    throw new Error("usePinterestEnvironment must be used within PinterestEnvironmentProvider");
  }
  return context;
}
