import { Capacitor } from "@capacitor/core";

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function nativePlatform(): "ios" | "android" | "web" {
  const p = Capacitor.getPlatform();
  return p === "ios" || p === "android" ? p : "web";
}

interface NativeBridgeOptions {
  onResume?: () => void;
  onUrlOpen?: (url: URL) => void;
}

let initialized = false;

export async function initNativeBridge(opts: NativeBridgeOptions = {}): Promise<void> {
  if (initialized || !Capacitor.isNativePlatform()) return;
  initialized = true;

  const { App } = await import("@capacitor/app");

  if (opts.onResume) {
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) opts.onResume!();
    });
  }

  if (opts.onUrlOpen) {
    App.addListener("appUrlOpen", (event) => {
      try {
        opts.onUrlOpen!(new URL(event.url));
      } catch (err) {
        console.error("[nativeBridge] invalid appUrlOpen url", event.url, err);
      }
    });
  }

  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else App.exitApp();
  });

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#FAF5EA" });
    }
  } catch (err) {
    console.warn("[nativeBridge] StatusBar setup skipped", err);
  }
}

export async function openExternalUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url, presentationStyle: "popover" });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function closeInAppBrowser(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    // Already closed or not open — ignore.
  }
}
