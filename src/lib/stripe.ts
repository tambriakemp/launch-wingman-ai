import { loadStripe } from "@stripe/stripe-js";

// Stripe publishable key - this is a PUBLIC key and safe to embed in code
// It will be read from env if available, otherwise uses the configured value
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  "pk_live_51QKUKLRrkj7dvrlNqCuphwuQrdW3RTNbmBqKwQhKpCZrXXPGAqvbQGLLCYOHbVW7JEpnqDYq2DKyNJXYTSPlFCxQ00NVwt63HY";

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn("Stripe publishable key is not set");
}

export const stripePromise = STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;
