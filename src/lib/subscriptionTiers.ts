// Stripe Price IDs for subscription tiers
// Pro is now the $49/mo all-features plan (was previously the Advanced tier);
// the prior $25 Pro tier was retired in the 3-tier consolidation.
export const SUBSCRIPTION_PRICE_IDS = {
  content_vault: 'price_1Ti5932Xu1EPwF6i3Xs91MUQ',
  pro: 'price_1Ti5962Xu1EPwF6iNR19b3tA',
} as const;

// Retired in the 3-tier consolidation. Kept here so any residual test
// subscriptions on the old $25 Pro price still resolve to Pro access
// rather than dropping to free. Safe to delete once Stripe confirms zero
// active subscriptions on this price.
const LEGACY_PRO_PRICE_ID_25 = 'price_1Ti5972Xu1EPwF6isrz0Z4fB';

// Subscription tier type
export type SubscriptionTier = 'free' | 'content_vault' | 'pro' | 'admin';

// Get tier from price ID
export const getTierFromPriceId = (priceId: string | null): SubscriptionTier => {
  if (!priceId) return 'free';
  if (priceId === SUBSCRIPTION_PRICE_IDS.content_vault) return 'content_vault';
  if (priceId === SUBSCRIPTION_PRICE_IDS.pro) return 'pro';
  if (priceId === LEGACY_PRO_PRICE_ID_25) return 'pro';
  return 'pro'; // Default to pro for any other paid subscription
};

// Display names for tiers
export const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  free: 'Free',
  content_vault: 'Vault',
  pro: 'Pro',
  admin: 'Admin',
};
