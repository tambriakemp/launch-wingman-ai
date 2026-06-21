// Central feature flag map.
// Toggle a flag to false to hide the feature from navigation and disable its
// routes everywhere in the app.
export const FEATURE_FLAGS = {
  salesPageWriter: false,
  emailSequence: false,
  socialPlanner: false,
  assessments: false,
  playbook: false,
  launchBrief: false,
  offer: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (key: FeatureFlagKey): boolean =>
  FEATURE_FLAGS[key];
