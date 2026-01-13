import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type TikTokEnvironment = "production" | "sandbox";

interface TikTokEnvironmentContextValue {
  environment: TikTokEnvironment;
  setEnvironment: (env: TikTokEnvironment) => void;
}

const TikTokEnvironmentContext = createContext<TikTokEnvironmentContextValue | undefined>(undefined);

const STORAGE_KEY = "tiktok_environment";

export function TikTokEnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironmentState] = useState<TikTokEnvironment>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === "sandbox" ? "sandbox" : "production") as TikTokEnvironment;
  });

  const setEnvironment = (env: TikTokEnvironment) => {
    setEnvironmentState(env);
    localStorage.setItem(STORAGE_KEY, env);
  };

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setEnvironmentState(e.newValue as TikTokEnvironment);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <TikTokEnvironmentContext.Provider value={{ environment, setEnvironment }}>
      {children}
    </TikTokEnvironmentContext.Provider>
  );
}

export function useTikTokEnvironment() {
  const context = useContext(TikTokEnvironmentContext);
  if (!context) {
    throw new Error("useTikTokEnvironment must be used within TikTokEnvironmentProvider");
  }
  return context;
}
