import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Block iOS pinch-to-zoom and double-tap zoom *only* on native, where this
// matches native-app conventions. On web we leave browser zoom alone so users
// who need to enlarge text can (WCAG 1.4.4).
if (typeof document !== "undefined" && Capacitor.isNativePlatform()) {
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("gesturechange", (e) => e.preventDefault());
  document.addEventListener("gestureend", (e) => e.preventDefault());
  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 350) e.preventDefault();
      lastTouchEnd = now;
    },
    { passive: false }
  );
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
