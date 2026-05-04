import { useEffect, useState } from "react";

/**
 * Detects whether the app is running inside a native shell.
 *
 * Recognizes:
 * - Capacitor (window.Capacitor.isNativePlatform())
 * - AppMySite WebView (matches "AppMySite" or "MobiloudApp" UA tokens — AppMySite
 *   is built on Mobiloud, so both can appear). Also supports a custom UA token
 *   "LaunchelyApp" if you configure one in AppMySite's advanced settings.
 */
export function useIsNativeApp() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform?.()) {
      setIsNative(true);
      return;
    }

    const ua = navigator.userAgent || "";
    if (/AppMySite|MobiloudApp|LaunchelyApp/i.test(ua)) {
      setIsNative(true);
      return;
    }

    // AppMySite/Mobiloud also exposes a global on some builds.
    if ((window as any).MobiLoud || (window as any).AppMySite) {
      setIsNative(true);
    }
  }, []);

  return isNative;
}
