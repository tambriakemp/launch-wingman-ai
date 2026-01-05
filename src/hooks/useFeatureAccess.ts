import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

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
  | 'content_vault'
  | 'social_calendar';

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
  'social_calendar',
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
  social_calendar: 'Social Media Calendar',
};

// Subscription tier type
export type SubscriptionTier = 'free' | 'pro' | 'admin';

export const useFeatureAccess = () => {
  const { isSubscribed, loading: authLoading } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdmin();

  // Combined loading state - don't make access decisions until both checks complete
  const isLoading = authLoading || adminLoading;

  // Determine the subscription tier
  // hasAdminAccess = admin OR manager, both get full access
  const tier: SubscriptionTier = hasAdminAccess ? 'admin' : isSubscribed ? 'pro' : 'free';

  // Check if user has access to a specific feature
  // Admins and managers always have full access
  const hasAccess = (feature: FeatureKey): boolean => {
    if (hasAdminAccess) return true;
    if (isSubscribed) return true;
    // Free users don't have access to Pro features
    return !PRO_FEATURES.includes(feature);
  };

  // Get limits for free plan (returns null for Pro/Admin/Manager users = unlimited)
  const getLimit = (limitKey: keyof typeof FREE_PLAN_LIMITS): number | string[] | null => {
    if (hasAdminAccess || isSubscribed) return null; // No limits for Pro/Admin/Manager
    return FREE_PLAN_LIMITS[limitKey];
  };

  // Check if user can create more projects
  const canCreateProject = (currentProjectCount: number): boolean => {
    if (hasAdminAccess || isSubscribed) return true;
    return currentProjectCount < FREE_PLAN_LIMITS.maxProjects;
  };

  // Check if user can save more drafts
  const canSaveDraft = (currentDraftCount: number): boolean => {
    if (hasAdminAccess || isSubscribed) return true;
    return currentDraftCount < FREE_PLAN_LIMITS.maxDrafts;
  };

  // Check if a sales copy section is available
  const canAccessSalesCopySection = (sectionId: string): boolean => {
    if (hasAdminAccess || isSubscribed) return true;
    return FREE_PLAN_LIMITS.salesCopySections.includes(sectionId);
  };

  // Get remaining daily ideas (returns null for Pro/Admin/Manager = unlimited)
  const getRemainingDailyIdeas = (usedToday: number): number | null => {
    if (hasAdminAccess || isSubscribed) return null;
    return Math.max(0, FREE_PLAN_LIMITS.dailyIdeas - usedToday);
  };

  // Get remaining drafts (returns null for Pro/Admin/Manager = unlimited)
  const getRemainingDrafts = (currentCount: number): number | null => {
    if (hasAdminAccess || isSubscribed) return null;
    return Math.max(0, FREE_PLAN_LIMITS.maxDrafts - currentCount);
  };

  return {
    isLoading,
    isSubscribed,
    hasAdminAccess,
    tier,
    hasAccess,
    getLimit,
    canCreateProject,
    canSaveDraft,
    canAccessSalesCopySection,
    getRemainingDailyIdeas,
    getRemainingDrafts,
    limits: (hasAdminAccess || isSubscribed) ? null : FREE_PLAN_LIMITS,
  };
};
