import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Public VAPID key — safe to embed. Replace with your generated key.
const VAPID_PUBLIC_KEY = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function upsertDevice(platform: "ios" | "android" | "web", token: string, deviceName?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("push_devices" as any).upsert(
    {
      user_id: user.id,
      platform,
      token,
      device_name: deviceName ?? navigator.userAgent.slice(0, 80),
      last_seen_at: new Date().toISOString(),
      disabled_at: null,
    },
    { onConflict: "user_id,token" },
  );
}

export function usePushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const cap = (window as any).Capacitor;
      if (cap?.isNativePlatform?.()) {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          const perm = await PushNotifications.requestPermissions();
          if (perm.receive !== "granted") return;
          await PushNotifications.register();
          PushNotifications.addListener("registration", async (t) => {
            if (cancelled) return;
            const platform = cap.getPlatform?.() === "ios" ? "ios" : "android";
            await upsertDevice(platform, t.value);
          });
          PushNotifications.addListener("registrationError", (err) => {
            console.error("Push register error", err);
          });
          PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
            const url = (action.notification?.data as any)?.url;
            if (url) window.location.assign(url);
          });
        } catch (e) {
          console.error("Capacitor push setup failed", e);
        }
        return;
      }

      // Web Push
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (!VAPID_PUBLIC_KEY) return;
      try {
        const reg = await navigator.serviceWorker.register("/push-sw.js");
        const perm = await Notification.requestPermission();
        if (perm !== "granted") return;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }
        if (!cancelled) await upsertDevice("web", JSON.stringify(sub.toJSON()));
      } catch (e) {
        console.error("Web push setup failed", e);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);
}
