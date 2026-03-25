// Stripe Price IDs for subscription tiers
export const SUBSCRIPTION_PRICE_IDS = {
  content_vault: 'price_1StiayF2gaEq7adwKHe9AbQF',
  pro: 'price_1SipMGF2gaEq7adwAGMICdO5',
  advanced: 'price_1TEznFF2gaEq7adwpTfGefLX',
} as const;

// Subscription tier type
export type SubscriptionTier = 'free' | 'content_vault' | 'pro' | 'advanced' | 'admin';

// Get tier from price ID
export const getTierFromPriceId = (priceId: string | null): SubscriptionTier => {
  if (!priceId) return 'free';
  if (priceId === SUBSCRIPTION_PRICE_IDS.content_vault) return 'content_vault';
  if (priceId === SUBSCRIPTION_PRICE_IDS.pro) return 'pro';
  if (priceId === SUBSCRIPTION_PRICE_IDS.advanced) return 'advanced';
  return 'pro'; // Default to pro for any other paid subscription
};

// Display names for tiers
export const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  free: 'Free',
  content_vault: 'Vault',
  pro: 'Pro',
  advanced: 'Advanced',
  admin: 'Admin',
};
