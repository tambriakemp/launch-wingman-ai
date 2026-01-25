import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe with the publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn("Stripe publishable key is not set");
}

export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;
