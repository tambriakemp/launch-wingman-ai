// Project Memory System
// Governs what information persists across relaunches and future projects

/**
 * Memory Layers
 * 
 * Foundational Memory (Always Persists):
 * - Target audience description
 * - Who the offer is for / not for
 * - Core problem being solved
 * - Dream outcome
 * - Offer format
 * 
 * Adaptive Memory (Persists with Gentle Review):
 * - Core message
 * - Transformation statement
 * - Preferred funnel type
 * - Content themes
 * - Typical launch window length
 * 
 * Ephemeral Memory (Never Persists):
 * - Task completion history
 * - Skipped tasks
 * - Draft content
 * - Launch dates
 * - Performance data / metrics
 */

// Foundational memory keys - always copied, no review needed
export const FOUNDATIONAL_MEMORY_KEYS = [
  'target_audience',
  'core_problem', 
  'dream_outcome',
  'offer_format',
] as const;

// Adaptive memory keys - copied with needs_review flag
export const ADAPTIVE_MEMORY_KEYS = [
  'messaging',
  'transformation_statement',
  'funnel_type',
  'content_themes',
  'launch_window_length',
] as const;

export type FoundationalMemoryKey = typeof FOUNDATIONAL_MEMORY_KEYS[number];
export type AdaptiveMemoryKey = typeof ADAPTIVE_MEMORY_KEYS[number];
export type MemoryKey = FoundationalMemoryKey | AdaptiveMemoryKey;

/**
 * Human-readable labels for memory elements
 */
export const MEMORY_LABELS: Record<MemoryKey, string> = {
  target_audience: 'Target audience',
  core_problem: 'Core problem',
  dream_outcome: 'Dream outcome',
  offer_format: 'Offer format',
  messaging: 'Core message',
  transformation_statement: 'Transformation statement',
  funnel_type: 'Funnel type',
  content_themes: 'Content themes',
  launch_window_length: 'Launch window',
};

/**
 * Descriptions for memory elements
 */
export const MEMORY_DESCRIPTIONS: Record<MemoryKey, string> = {
  target_audience: 'Who your offer serves',
  core_problem: 'The main struggle you solve',
  dream_outcome: 'What success looks like for them',
  offer_format: 'Course, service, program, etc.',
  messaging: 'Your core message and voice',
  transformation_statement: 'The change you create',
  funnel_type: 'How you guide people to your offer',
  content_themes: 'Topics you create content around',
  launch_window_length: 'Typical launch duration',
};

/**
 * Check if a memory key is foundational
 */
export function isFoundationalMemory(key: string): key is FoundationalMemoryKey {
  return (FOUNDATIONAL_MEMORY_KEYS as readonly string[]).includes(key);
}

/**
 * Check if a memory key is adaptive
 */
export function isAdaptiveMemory(key: string): key is AdaptiveMemoryKey {
  return (ADAPTIVE_MEMORY_KEYS as readonly string[]).includes(key);
}

/**
 * Project memory record from database
 */
export interface ProjectMemoryRecord {
  id: string;
  project_id: string;
  user_id: string;
  memory_key: string;
  needs_review: boolean;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
