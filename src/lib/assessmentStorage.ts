// Assessment storage utility with user-scoped keys
// This ensures each user has their own assessment data

export const getAssessmentStorageKey = (baseKey: string, userId: string | undefined): string => {
  if (!userId) {
    // Fallback for unauthenticated state - shouldn't happen in practice
    return `${baseKey}_anonymous`;
  }
  return `${baseKey}_${userId}`;
};

// Storage keys for each assessment type
export const ASSESSMENT_KEYS = {
  LAUNCH: 'coach_hub_launch_assessment',
  COACH: 'coach_hub_coach_assessment',
  WHY_STATEMENT: 'coach_hub_why_statement',
} as const;

export type AssessmentType = keyof typeof ASSESSMENT_KEYS;

// Helper to get/set assessment data with user scoping
export const getAssessmentData = <T>(baseKey: string, userId: string | undefined): T | null => {
  const key = getAssessmentStorageKey(baseKey, userId);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const setAssessmentData = <T>(baseKey: string, userId: string | undefined, data: T): void => {
  const key = getAssessmentStorageKey(baseKey, userId);
  localStorage.setItem(key, JSON.stringify(data));
};

export const removeAssessmentData = (baseKey: string, userId: string | undefined): void => {
  const key = getAssessmentStorageKey(baseKey, userId);
  localStorage.removeItem(key);
};
