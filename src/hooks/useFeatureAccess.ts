import { useAuth } from "@/contexts/AuthContext";

// Feature keys for gating
export type FeatureKey = 
  | 'unlimited_projects'
  | 'relaunch_mode'
  | 'insights_history'
  | 'cross_project_visibility'
  | 'export_snapshot'
  | 'full_sales_copy'
  | 'multiple_offers_sales_copy'
  | 'unlimited_ideas'
  | 'unlimited_drafts'
  | 'content_vault';

// Limits for free plan
export const FREE_PLAN_LIMITS = {
  maxProjects: 1,
  dailyIdeas: 5,
  maxDrafts: 5,
  salesCopySections: ['headline', 'core_promise', 'cta'], // Limited sections
};

// Pro features list
export const PRO_FEATURES: FeatureKey[] = [
  'unlimited_projects',
  'relaunch_mode',
  'insights_history',
  'cross_project_visibility',
  'export_snapshot',
  'full_sales_copy',
  'multiple_offers_sales_copy',
  'unlimited_ideas',
  'unlimited_drafts',
  'content_vault',
];

// Feature display names for UI
export const FEATURE_DISPLAY_NAMES: Record<FeatureKey, string> = {
  unlimited_projects: 'Unlimited Projects',
  relaunch_mode: 'Relaunch Mode',
  insights_history: 'Insights History',
  cross_project_visibility: 'Cross-Project Visibility',
  export_snapshot: 'Export Phase Snapshot',
  full_sales_copy: 'Full Sales Copy Builder',
  multiple_offers_sales_copy: 'Multiple Offers in Sales Copy',
  unlimited_ideas: 'Unlimited Daily Ideas',
  unlimited_drafts: 'Unlimited Content Drafts',
  content_vault: 'Content Vault',
};

export const useFeatureAccess = () => {
  const { isSubscribed } = useAuth();

  // Check if user has access to a specific feature
  const hasAccess = (feature: FeatureKey): boolean => {
    if (isSubscribed) return true;
    // Free users don't have access to Pro features
    return !PRO_FEATURES.includes(feature);
  };

  // Get limits for free plan (returns null for Pro users = unlimited)
  const getLimit = (limitKey: keyof typeof FREE_PLAN_LIMITS): number | string[] | null => {
    if (isSubscribed) return null; // No limits for Pro
    return FREE_PLAN_LIMITS[limitKey];
  };

  // Check if user can create more projects
  const canCreateProject = (currentProjectCount: number): boolean => {
    if (isSubscribed) return true;
    return currentProjectCount < FREE_PLAN_LIMITS.maxProjects;
  };

  // Check if user can save more drafts
  const canSaveDraft = (currentDraftCount: number): boolean => {
    if (isSubscribed) return true;
    return currentDraftCount < FREE_PLAN_LIMITS.maxDrafts;
  };

  // Check if a sales copy section is available
  const canAccessSalesCopySection = (sectionId: string): boolean => {
    if (isSubscribed) return true;
    return FREE_PLAN_LIMITS.salesCopySections.includes(sectionId);
  };

  // Get remaining daily ideas (returns null for Pro = unlimited)
  const getRemainingDailyIdeas = (usedToday: number): number | null => {
    if (isSubscribed) return null;
    return Math.max(0, FREE_PLAN_LIMITS.dailyIdeas - usedToday);
  };

  // Get remaining drafts (returns null for Pro = unlimited)
  const getRemainingDrafts = (currentCount: number): number | null => {
    if (isSubscribed) return null;
    return Math.max(0, FREE_PLAN_LIMITS.maxDrafts - currentCount);
  };

  return {
    isSubscribed,
    hasAccess,
    getLimit,
    canCreateProject,
    canSaveDraft,
    canAccessSalesCopySection,
    getRemainingDailyIdeas,
    getRemainingDrafts,
    limits: isSubscribed ? null : FREE_PLAN_LIMITS,
  };
};
