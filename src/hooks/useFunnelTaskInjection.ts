/**
 * Funnel Task Injection Hook
 * 
 * This hook handles the injection of funnel-specific tasks based on the selected funnel type.
 * Injection happens ONLY when the user completes the "Choose how you'll sell your offer" task.
 * 
 * Key principles:
 * - Never delete existing tasks
 * - Never modify completed tasks
 * - Most funnels inject only into Build, Content, and Launch phases
 * - Membership funnel also injects into Planning and Messaging phases
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FunnelType, 
  ProjectTask, 
  TaskTemplate, 
  Phase,
  LegacyFunnelType,
  LEGACY_FUNNEL_TYPE_MAP,
} from '@/types/tasks';
import { 
  getDeltaTasksForFunnel, 
  getTaskModificationsForFunnel,
  INJECTION_ALLOWED_PHASES,
} from '@/data/funnelDeltaTasks';
import { getUniversalTasks } from '@/data/taskTemplates';

interface UseFunnelTaskInjectionOptions {
  projectId: string;
}

interface InjectionResult {
  success: boolean;
  injectedCount: number;
  error?: string;
}

export function useFunnelTaskInjection({ projectId }: UseFunnelTaskInjectionOptions) {
  const { user } = useAuth();

  /**
   * Normalize funnel type - converts legacy types to new types
   */
  const normalizeFunnelType = useCallback((rawType: string | null): FunnelType | null => {
    if (!rawType) return null;
    
    // Check if it's a legacy type
    if (rawType in LEGACY_FUNNEL_TYPE_MAP) {
      return LEGACY_FUNNEL_TYPE_MAP[rawType as LegacyFunnelType];
    }
    
    // Return as-is if it's already a valid new type
    const validTypes: FunnelType[] = [
      'content_to_offer',
      'freebie_email_offer', 
      'live_training_offer',
      'application_call',
      'membership',
      'challenge',
      'launch',
      'all',
    ];
    
    if (validTypes.includes(rawType as FunnelType)) {
      return rawType as FunnelType;
    }
    
    // Default to content_to_offer for unknown types
    return 'content_to_offer';
  }, []);

  /**
   * Inject delta tasks for a specific funnel type
   * This is called when the user completes the planning_choose_launch_path task
   */
  const injectFunnelTasks = useCallback(async (
    funnelType: FunnelType,
    existingTasks: ProjectTask[]
  ): Promise<InjectionResult> => {
    if (!user) {
      return { success: false, injectedCount: 0, error: 'Not authenticated' };
    }

    if (funnelType === 'all') {
      // Just ensure universal tasks for later phases exist
      return await ensureUniversalTasksExist(existingTasks);
    }

    try {
      const deltaTasks = getDeltaTasksForFunnel(funnelType);
      const universalLaterTasks = getUniversalTasks().filter(
        t => t.phase !== 'planning' && t.phase !== 'messaging'
      );
      const existingTaskIds = new Set(existingTasks.map(t => t.taskId));

      const rows = [...deltaTasks, ...universalLaterTasks]
        .filter(template => !existingTaskIds.has(template.taskId))
        .map(template => ({
          project_id: projectId,
          user_id: user.id,
          task_id: template.taskId,
          status: 'not_started' as const,
        }));

      if (rows.length === 0) {
        return { success: true, injectedCount: 0 };
      }

      const { error } = await supabase.from('project_tasks').insert(rows);
      if (error) {
        console.error('Error batch-injecting tasks:', error);
        return { success: false, injectedCount: 0, error: error.message };
      }

      return { success: true, injectedCount: rows.length };
    } catch (err) {
      console.error('Error during task injection:', err);
      return { 
        success: false, 
        injectedCount: 0, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }, [user, projectId]);

  /**
   * Ensure universal tasks exist for all phases
   * Used for content_to_offer funnel type
   */
  const ensureUniversalTasksExist = useCallback(async (
    existingTasks: ProjectTask[]
  ): Promise<InjectionResult> => {
    if (!user) {
      return { success: false, injectedCount: 0, error: 'Not authenticated' };
    }

    try {
      const universalTasks = getUniversalTasks().filter(
        t => t.phase !== 'planning' && t.phase !== 'messaging'
      );
      const existingTaskIds = new Set(existingTasks.map(t => t.taskId));

      const rows = universalTasks
        .filter(template => !existingTaskIds.has(template.taskId))
        .map(template => ({
          project_id: projectId,
          user_id: user.id,
          task_id: template.taskId,
          status: 'not_started' as const,
        }));

      if (rows.length === 0) {
        return { success: true, injectedCount: 0 };
      }

      const { error } = await supabase.from('project_tasks').insert(rows);
      if (error) {
        console.error('Error batch-injecting universal tasks:', error);
        return { success: false, injectedCount: 0, error: error.message };
      }

      return { success: true, injectedCount: rows.length };
    } catch (err) {
      console.error('Error ensuring universal tasks:', err);
      return { 
        success: false, 
        injectedCount: 0, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }, [user, projectId]);

  /**
   * Handle funnel type change
   * This should only be allowed before Launch phase begins
   */
  const handleFunnelTypeChange = useCallback(async (
    previousFunnelType: FunnelType | null,
    newFunnelType: FunnelType,
    existingTasks: ProjectTask[],
    activePhase: Phase
  ): Promise<InjectionResult> => {
    if (!user) {
      return { success: false, injectedCount: 0, error: 'Not authenticated' };
    }

    // Block changes during or after launch phase
    if (activePhase === 'launch' || activePhase === 'post-launch') {
      return { 
        success: false, 
        injectedCount: 0, 
        error: 'Funnel type cannot be changed during or after launch' 
      };
    }

    // If previous funnel type exists, remove unstarted funnel-specific tasks
    if (previousFunnelType && previousFunnelType !== 'content_to_offer' && previousFunnelType !== 'all') {
      const previousDeltaTasks = getDeltaTasksForFunnel(previousFunnelType);
      const previousDeltaTaskIds = new Set(previousDeltaTasks.map(t => t.taskId));

      // Find tasks that belong to the previous funnel and are not started
      const tasksToRemove = existingTasks.filter(t => 
        previousDeltaTaskIds.has(t.taskId) && 
        t.status === 'not_started'
      );

      // Delete unstarted previous funnel tasks
      for (const task of tasksToRemove) {
        await supabase
          .from('project_tasks')
          .delete()
          .eq('id', task.id)
          .eq('user_id', user.id);
      }
    }

    // Inject new funnel tasks
    return await injectFunnelTasks(newFunnelType, existingTasks);
  }, [user, injectFunnelTasks]);

  /**
   * Check if funnel type change is allowed
   */
  const canChangeFunnelType = useCallback((activePhase: Phase): boolean => {
    return activePhase !== 'launch' && activePhase !== 'post-launch';
  }, []);

  /**
   * Get applicable templates for a funnel type (including modifications)
   * This merges universal tasks with delta tasks and applies modifications
   */
  const getApplicableTemplates = useCallback((
    funnelType: FunnelType | null
  ): TaskTemplate[] => {
    const universalTasks = getUniversalTasks();
    
    if (!funnelType || funnelType === 'all') {
      return universalTasks;
    }

    // Get delta tasks for this funnel
    const deltaTasks = getDeltaTasksForFunnel(funnelType);
    const modifications = getTaskModificationsForFunnel(funnelType);
    
    // Create a map for modifications
    const modificationMap = new Map(modifications.map(m => [m.taskId, m.changes]));
    
    // Apply modifications to universal tasks
    const modifiedUniversalTasks = universalTasks.map(task => {
      const changes = modificationMap.get(task.taskId);
      if (changes) {
        return { ...task, ...changes };
      }
      return task;
    });

    // Merge and sort by phase, then order
    const allTasks = [...modifiedUniversalTasks, ...deltaTasks];
    
    return allTasks.sort((a, b) => {
      // First sort by phase order
      const phaseOrder: Record<Phase, number> = {
        setup: -1,
        planning: 0,
        messaging: 1,
        build: 2,
        content: 3,
        'pre-launch': 4,
        launch: 5,
        'post-launch': 6,
      };
      const phaseDiff = phaseOrder[a.phase] - phaseOrder[b.phase];
      if (phaseDiff !== 0) return phaseDiff;
      
      // Then by order within phase
      return a.order - b.order;
    });
  }, []);

  return {
    normalizeFunnelType,
    injectFunnelTasks,
    handleFunnelTypeChange,
    canChangeFunnelType,
    getApplicableTemplates,
  };
}
