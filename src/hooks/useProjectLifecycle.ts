import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ProjectState,
  canTransitionTo,
  isTaskEngineActive,
  getDashboardViewType,
  DashboardViewType,
  PROJECT_STATE_LABELS,
} from '@/types/projectLifecycle';

interface UseProjectLifecycleOptions {
  projectId: string;
}

interface UseProjectLifecycleReturn {
  projectState: ProjectState;
  isLoading: boolean;
  error: string | null;
  isTaskEngineActive: boolean;
  dashboardViewType: DashboardViewType;
  transitionTo: (newState: ProjectState) => Promise<boolean>;
  pause: () => Promise<boolean>;
  resume: () => Promise<boolean>;
  archive: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  markLaunched: () => Promise<boolean>;
  markCompleted: () => Promise<boolean>;
  refreshState: () => Promise<void>;
}

/**
 * Determines the appropriate project state based on phase and task data
 */
function determineProjectState(
  currentStatus: string,
  activePhase: string | null,
  phaseStatuses: Record<string, string> | null,
  hasCompletedTasks: boolean
): ProjectState {
  // If already in a valid lifecycle state, return it
  const validStates: ProjectState[] = ['draft', 'in_progress', 'launched', 'completed', 'paused', 'archived'];
  if (validStates.includes(currentStatus as ProjectState)) {
    return currentStatus as ProjectState;
  }

  // Check if launch phase is complete - this means the project has launched
  if (phaseStatuses) {
    const launchComplete = phaseStatuses['launch'] === 'complete';
    if (launchComplete) {
      return 'launched';
    }
  }

  // Legacy status migration
  if (currentStatus === 'active') {
    // Determine if draft or in_progress based on activity
    if (hasCompletedTasks) {
      return 'in_progress';
    }
    return 'draft';
  }

  // Default to draft for unknown states
  return 'draft';
}

export function useProjectLifecycle({ projectId }: UseProjectLifecycleOptions): UseProjectLifecycleReturn {
  const { user } = useAuth();
  const [projectState, setProjectState] = useState<ProjectState>('draft');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current project state
  const fetchState = useCallback(async () => {
    if (!user || !projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get project data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('status, active_phase, phase_statuses')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (projectError) throw projectError;

      // Check if user has any completed tasks
      const { count } = await supabase
        .from('project_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const hasCompletedTasks = (count || 0) > 0;

      const state = determineProjectState(
        project.status,
        project.active_phase,
        project.phase_statuses as Record<string, string> | null,
        hasCompletedTasks
      );

      setProjectState(state);

      // If state differs from stored status, update it
      if (state !== project.status) {
        await supabase
          .from('projects')
          .update({ status: state })
          .eq('id', projectId)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error fetching project lifecycle state:', err);
      setError('Failed to load project state');
    } finally {
      setIsLoading(false);
    }
  }, [user, projectId]);

  // Transition to a new state
  const transitionTo = useCallback(
    async (newState: ProjectState): Promise<boolean> => {
      if (!user) return false;

      // Validate transition
      if (!canTransitionTo(projectState, newState)) {
        toast.error(`Cannot transition from ${PROJECT_STATE_LABELS[projectState]} to ${PROJECT_STATE_LABELS[newState]}`);
        return false;
      }

      try {
        const { error } = await supabase
          .from('projects')
          .update({ status: newState })
          .eq('id', projectId)
          .eq('user_id', user.id);

        if (error) throw error;

        setProjectState(newState);
        toast.success(`Project moved to ${PROJECT_STATE_LABELS[newState]}`);
        return true;
      } catch (err) {
        console.error('Error transitioning project state:', err);
        toast.error('Failed to update project status');
        return false;
      }
    },
    [user, projectId, projectState]
  );

  // Convenience methods for common transitions
  const pause = useCallback(async (): Promise<boolean> => {
    return transitionTo('paused');
  }, [transitionTo]);

  const resume = useCallback(async (): Promise<boolean> => {
    // Resume to in_progress (or draft if no tasks completed)
    const { count } = await supabase
      .from('project_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'completed');

    const targetState: ProjectState = (count || 0) > 0 ? 'in_progress' : 'draft';
    return transitionTo(targetState);
  }, [transitionTo, projectId]);

  const archive = useCallback(async (): Promise<boolean> => {
    return transitionTo('archived');
  }, [transitionTo]);

  const restore = useCallback(async (): Promise<boolean> => {
    // Restore to appropriate active state
    const { count } = await supabase
      .from('project_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'completed');

    const targetState: ProjectState = (count || 0) > 0 ? 'in_progress' : 'draft';
    return transitionTo(targetState);
  }, [transitionTo, projectId]);

  const markLaunched = useCallback(async (): Promise<boolean> => {
    // First ensure we're in_progress, then move to launched
    if (projectState !== 'in_progress') {
      // Force transition for launch completion
      try {
        // Get project name first
        const { data: project } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single();
        
        const { error } = await supabase
          .from('projects')
          .update({ status: 'launched' })
          .eq('id', projectId);

        if (error) throw error;

        setProjectState('launched');
        toast.success('Congratulations! Your launch is complete! 🎉');
        
        // Send launch_completed email (fire and forget)
        supabase.functions.invoke("send-notification-email", {
          body: {
            email_type: "launch_completed",
            user_id: user?.id,
            data: { projectId, projectName: project?.name },
          },
        }).catch((err) => console.error("Failed to send launch completed email:", err));
        
        return true;
      } catch (err) {
        console.error('Error marking project as launched:', err);
        toast.error('Failed to update project status');
        return false;
      }
    }
    return transitionTo('launched');
  }, [transitionTo, projectState, projectId, user?.id]);

  const markCompleted = useCallback(async (): Promise<boolean> => {
    // Force transition to completed
    try {
      // Get project name first
      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();
      
      const { error } = await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', projectId);

      if (error) throw error;

      setProjectState('completed');
      toast.success("Your launch journey is complete. What would you like to do next?");
      
      // Send project_completed email (fire and forget)
      supabase.functions.invoke("send-notification-email", {
        body: {
          email_type: "project_completed",
          user_id: user?.id,
          data: { projectId, projectName: project?.name },
        },
      }).catch((err) => console.error("Failed to send project completed email:", err));
      
      // Check if this is the user's second completed project for playbook_ready email
      const { count: completedCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('status', 'completed');
      
      if (completedCount === 2) {
        // Check if playbook_ready email was ever sent to this user
        const { count: playbookEmailCount } = await supabase
          .from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)
          .eq('email_type', 'playbook_ready');
        
        // Only send if never sent before
        if (playbookEmailCount === 0) {
          supabase.functions.invoke("send-notification-email", {
            body: {
              email_type: "playbook_ready",
              user_id: user?.id,
              data: {},
            },
          }).catch((err) => console.error("Failed to send playbook ready email:", err));
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error marking project as completed:', err);
      toast.error('Failed to update project status');
      return false;
    }
  }, [projectId, user?.id]);

  const refreshState = useCallback(async () => {
    await fetchState();
  }, [fetchState]);

  // Initial fetch
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  return {
    projectState,
    isLoading,
    error,
    isTaskEngineActive: isTaskEngineActive(projectState),
    dashboardViewType: getDashboardViewType(projectState),
    transitionTo,
    pause,
    resume,
    archive,
    restore,
    markLaunched,
    markCompleted,
    refreshState,
  };
}
