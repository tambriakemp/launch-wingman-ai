import { loadStripe } from "@stripe/stripe-js";

// Stripe publishable key - loaded from environment variable
// This MUST match the same Stripe account as the backend STRIPE_SECRET_KEY
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  console.error("[Stripe] VITE_STRIPE_PUBLISHABLE_KEY is not configured! Payment form will not load.");
}

console.log("[Stripe] Publishable key configured:", STRIPE_PUBLISHABLE_KEY ? "Yes" : "No");

export const stripePromise = STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;
