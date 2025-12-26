import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";

// Map from project's selected_funnel_type to FUNNEL_CONFIGS keys
export const FUNNEL_TYPE_TO_CONFIG: Record<string, string> = {
  'content_to_offer': 'freebie-funnel',
  'freebie_email_offer': 'freebie-funnel',
  'live_training_offer': 'webinar-funnel',
  'application_call': 'application-funnel',
  'membership': 'membership-funnel',
  'challenge': 'challenge-funnel',
  'launch': 'launch-funnel',
};

/**
 * Get the FUNNEL_CONFIGS key for a given selected funnel type
 */
export function getFunnelConfigKey(selectedFunnelType: string | null | undefined): string | null {
  if (!selectedFunnelType) return null;
  return FUNNEL_TYPE_TO_CONFIG[selectedFunnelType] || null;
}

/**
 * Get the FunnelConfig for a given selected funnel type
 */
export function getFunnelConfig(selectedFunnelType: string | null | undefined) {
  const key = getFunnelConfigKey(selectedFunnelType);
  if (!key) return null;
  return FUNNEL_CONFIGS[key] || null;
}
