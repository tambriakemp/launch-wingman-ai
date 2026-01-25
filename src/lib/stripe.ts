import { loadStripe } from "@stripe/stripe-js";

// Stripe publishable key - this is a PUBLIC key and safe to embed in code
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  "pk_live_51QKUKLRrkj7dvrlNqCuphwuQrdW3RTNbmBqKwQhKpCZrXXPGAqvbQGLLCYOHbVW7JEpnqDYq2DKyNJXYTSPlFCxQ00NVwt63HY";

console.log("[Stripe] Publishable key loaded:", STRIPE_PUBLISHABLE_KEY ? "✓" : "✗");
console.log("[Stripe] Key prefix:", STRIPE_PUBLISHABLE_KEY?.substring(0, 7));

export const stripePromise = STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;
