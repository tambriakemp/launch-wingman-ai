import { supabase } from '@/integrations/supabase/client';

interface TrackActivityOptions {
  eventType: 'login' | 'signup' | 'task_complete' | 'assessment_complete';
  metadata?: Record<string, unknown>;
  isNewSignup?: boolean;
}

/**
 * Track user activity to the backend
 */
export const trackUserActivity = async ({ 
  eventType, 
  metadata = {}, 
  isNewSignup = false 
}: TrackActivityOptions): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await supabase.functions.invoke('track-activity', {
      body: {
        event_type: eventType,
        metadata,
        is_new_signup: isNewSignup,
      },
    });
  } catch (error) {
    // Silently fail - activity tracking should not block user flow
    console.error('Failed to track activity:', error);
  }
};

/**
 * Track task completion
 */
export const trackTaskComplete = async (taskId: string, taskName: string): Promise<void> => {
  await trackUserActivity({
    eventType: 'task_complete',
    metadata: {
      task_id: taskId,
      task_name: taskName,
    },
  });
};

/**
 * Track assessment completion
 */
export const trackAssessmentComplete = async (assessmentId: string, assessmentName: string, score?: number): Promise<void> => {
  await trackUserActivity({
    eventType: 'assessment_complete',
    metadata: {
      assessment_id: assessmentId,
      assessment_name: assessmentName,
      score,
    },
  });
};
