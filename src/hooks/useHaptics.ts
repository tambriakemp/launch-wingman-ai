// Lightweight haptics wrapper for native (Capacitor) with web fallback.
// Capacitor Haptics is optional; we resolve dynamically and silently no-op on web.

type Style = "light" | "medium" | "heavy" | "selection" | "success";

let cachedHaptics: any | null | undefined;

const getHaptics = async () => {
  if (cachedHaptics !== undefined) return cachedHaptics;
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) {
    cachedHaptics = null;
    return null;
  }
  try {
    // @ts-ignore - optional dependency
    const mod = await import(/* @vite-ignore */ "@capacitor/haptics" as string).catch(() => null);
    cachedHaptics = mod ?? null;
  } catch {
    cachedHaptics = null;
  }
  return cachedHaptics;
};

export const useHaptics = () => {
  const trigger = async (style: Style = "selection") => {
    // Web fallback: navigator.vibrate (Android browsers)
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    const mod = await getHaptics();
    if (mod) {
      try {
        const { Haptics, ImpactStyle, NotificationType } = mod;
        if (style === "selection") return Haptics.selectionStart?.() ?? Haptics.impact?.({ style: ImpactStyle.Light });
        if (style === "success") return Haptics.notification?.({ type: NotificationType.Success });
        const map: Record<string, any> = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy,
        };
        return Haptics.impact?.({ style: map[style] ?? ImpactStyle.Light });
      } catch {
        // fall through to vibrate
      }
    }
    if (nav?.vibrate) {
      const ms = style === "heavy" ? 25 : style === "medium" ? 15 : 8;
      nav.vibrate(ms);
    }
  };
  return { trigger };
};
