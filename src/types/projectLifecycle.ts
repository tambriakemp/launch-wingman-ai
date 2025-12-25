// Project Lifecycle State System
// Governs how projects move from creation through launch, reflection, pausing, and completion

/**
 * Primary Project States (Top-Level)
 * Each project must always be in exactly one of these states
 */
export const PROJECT_STATES = [
  'draft',
  'in_progress',
  'launched',
  'completed',
  'paused',
  'archived',
] as const;

export type ProjectState = typeof PROJECT_STATES[number];

/**
 * Human-readable labels for project states
 */
export const PROJECT_STATE_LABELS: Record<ProjectState, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  launched: 'Recently Launched',
  completed: 'Completed',
  paused: 'Paused',
  archived: 'Archived',
};

/**
 * Descriptions for each project state (for UI help text)
 */
export const PROJECT_STATE_DESCRIPTIONS: Record<ProjectState, string> = {
  draft: "You've started planning but haven't fully committed yet.",
  in_progress: "You're actively working through phases.",
  launched: "You completed a launch window. Time to reflect!",
  completed: "You've reflected and chosen your next step.",
  paused: "You're intentionally taking a break.",
  archived: "This project is inactive but preserved.",
};

/**
 * Which states count toward project limits (billing)
 * Only active projects count toward limits
 */
export const COUNTS_TOWARD_LIMITS: ProjectState[] = [
  'draft',
  'in_progress',
  'launched',
];

/**
 * Which states allow the Next Best Task engine to run
 */
export const TASK_ENGINE_ACTIVE_STATES: ProjectState[] = [
  'draft',
  'in_progress',
  'launched', // Tasks should work in launched state for post-launch reflection
];

/**
 * Allowed state transitions
 */
export const ALLOWED_TRANSITIONS: Record<ProjectState, ProjectState[]> = {
  draft: ['in_progress', 'paused', 'archived'],
  in_progress: ['launched', 'paused', 'archived'],
  launched: ['completed', 'paused'],
  completed: ['archived', 'in_progress'], // Allow restart for relaunch
  paused: ['in_progress', 'archived', 'draft'],
  archived: ['draft', 'in_progress', 'paused'], // Can be restored
};

/**
 * Check if a transition is allowed
 */
export function canTransitionTo(from: ProjectState, to: ProjectState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Determine if the Next Best Task engine should be active
 */
export function isTaskEngineActive(state: ProjectState): boolean {
  return TASK_ENGINE_ACTIVE_STATES.includes(state);
}

/**
 * Determine if the project counts toward billing limits
 */
export function countsTowardLimits(state: ProjectState): boolean {
  return COUNTS_TOWARD_LIMITS.includes(state);
}

/**
 * Get the appropriate dashboard view type based on project state
 */
export type DashboardViewType = 'tasks' | 'launched' | 'completed' | 'paused' | 'archived';

export function getDashboardViewType(state: ProjectState): DashboardViewType {
  switch (state) {
    case 'draft':
    case 'in_progress':
      return 'tasks';
    case 'launched':
      return 'launched';
    case 'completed':
      return 'completed';
    case 'paused':
      return 'paused';
    case 'archived':
      return 'archived';
  }
}
