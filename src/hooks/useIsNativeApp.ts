import { useEffect, useState } from "react";

export function useIsNativeApp() {
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    const cap = (window as any).Capacitor;
    setIsNative(!!cap?.isNativePlatform?.());
  }, []);
  return isNative;
}
