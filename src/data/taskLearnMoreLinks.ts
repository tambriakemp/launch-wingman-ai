/**
 * Task-to-Library Article Mapping
 * 
 * This file defines which tasks should have "Learn more" links
 * and maps them to their corresponding Library articles.
 * 
 * RULES:
 * - NOT every task gets a Learn more link
 * - Only tasks that commonly cause confusion, overthinking, or fear
 * - Launch phase tasks have NO links (confidence > explanation)
 * - Review tasks have NO links
 */

interface TaskLearnMoreMapping {
  taskId: string;
  articleId: string;
}

// Explicit mapping of task IDs to article IDs
export const TASK_LEARN_MORE_LINKS: TaskLearnMoreMapping[] = [
  // ==================== PLANNING PHASE ====================
  // "Define your target audience" - Article doesn't exist yet, skip for now
  // { taskId: 'planning_define_audience', articleId: 'how-to-define-audience' },
  
  // "Identify your audience's main problem"
  { taskId: 'planning_define_problem', articleId: 'pain-points-explained' },
  
  // "Define your audience's dream outcome"
  { taskId: 'planning_define_dream_outcome', articleId: 'what-is-dream-outcome' },
  
  // "Increase belief that this will work"
  { taskId: 'planning_perceived_likelihood', articleId: 'perceived-likelihood' },
  
  // "Create a simple offer snapshot"
  { taskId: 'planning_offer_snapshot', articleId: 'simple-offer' },
  
  // "Choose how you'll sell your offer"
  { taskId: 'planning_choose_launch_path', articleId: 'what-is-funnel' },
  
  // planning_phase_review → NO LINK (review task)

  // ==================== MESSAGING PHASE ====================
  // "Clarify your core message"
  { taskId: 'messaging_core_message', articleId: 'core-message-basics' },
  
  // "Write your transformation statement"
  { taskId: 'messaging_transformation_statement', articleId: 'transformation-statement' },
  
  // "Identify common objections"
  { taskId: 'messaging_common_objections', articleId: 'objections' },
  
  // messaging_talking_points → NO LINK (not in user's list)
  // messaging_phase_review → NO LINK (review task)

  // ==================== BUILD PHASE ====================
  // Universal tasks: NO LINKS
  // build_choose_platform → NO LINK
  // build_payments_setup → NO LINK
  
  // Funnel-specific tasks:
  // "Create your free resource" (Freebie → Email → Offer)
  { taskId: 'build_create_freebie', articleId: 'freebie-email-offer' },
  
  // "Define your live training focus" (Live Training → Offer)
  { taskId: 'build_define_training_focus', articleId: 'live-training-offer' },
  
  // "Clarify who should apply" (Application → Call)
  { taskId: 'build_clarify_applicants', articleId: 'application-call' },

  // ==================== CONTENT PHASE ====================
  // Note: "Understand content intent" task doesn't exist in current templates
  // Mapping closest content task to the article
  { taskId: 'content_choose_platforms', articleId: 'content-planner-basics' },
  
  // content_define_themes → NO LINK
  // content_write_captions → NO LINK
  // content_plan_launch_window → NO LINK
  // content_phase_review → NO LINK

  // ==================== LAUNCH PHASE ====================
  // ALL LAUNCH TASKS → NO LINKS
  // Rationale: At launch, confidence and action matter more than explanation

  // ==================== POST-LAUNCH PHASE ====================
  // "Reflect on the experience"
  { taskId: 'postlaunch_reflection', articleId: 'post-launch-reflection' },
  
  // postlaunch_next_step → NO LINK
];

/**
 * Get the article ID for a given task ID
 * Returns undefined if the task should not have a Learn more link
 */
export const getLearnMoreArticleId = (taskId: string): string | undefined => {
  const mapping = TASK_LEARN_MORE_LINKS.find(m => m.taskId === taskId);
  return mapping?.articleId;
};

/**
 * Check if a task should have a Learn more link
 */
export const taskHasLearnMoreLink = (taskId: string): boolean => {
  return TASK_LEARN_MORE_LINKS.some(m => m.taskId === taskId);
};

// ==================== APP-LEVEL LINKS ====================
// These appear outside task screens

export const APP_LEVEL_LEARN_MORE = {
  // Dashboard - when users are confused about flow
  dashboard: 'next-best-task',
  
  // Phase intro screens
  phaseIntro: 'phases-overview',
  
  // Onboarding / Project creation
  onboarding: 'how-launchely-works',
} as const;
