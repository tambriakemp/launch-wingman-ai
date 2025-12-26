import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Phase,
  PHASES,
  TaskStatus,
  PhaseStatus,
  ProjectTask,
  NextBestTask,
  TaskTemplate,
  FunnelType,
  SkipReason,
} from '@/types/tasks';
import { TASK_TEMPLATES, getUniversalTasks } from '@/data/taskTemplates';
import { useFunnelTaskInjection } from './useFunnelTaskInjection';

interface ProjectPhaseData {
  active_phase: Phase;
  selected_funnel_type: FunnelType | null;
  phase_statuses: Record<Phase, PhaseStatus>;
}

interface UseTaskEngineOptions {
  projectId: string;
}

interface UseTaskEngineReturn {
  isLoading: boolean;
  error: string | null;
  nextBestTask: NextBestTask | null;
  activePhase: Phase;
  phaseStatuses: Record<Phase, PhaseStatus>;
  projectTasks: ProjectTask[];
  selectedFunnelType: FunnelType | null;
  getTaskTemplate: (taskId: string) => TaskTemplate | undefined;
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, inputData?: Record<string, unknown>) => Promise<void>;
  skipTask: (taskId: string, reason: SkipReason) => Promise<void>;
  selectFunnelType: (funnelType: FunnelType) => Promise<void>;
  refreshTasks: () => Promise<void>;
  canChangeFunnelType: boolean;
}

const DEFAULT_PHASE_STATUSES: Record<Phase, PhaseStatus> = {
  planning: 'active',
  messaging: 'locked',
  build: 'locked',
  content: 'locked',
  launch: 'locked',
  'post-launch': 'locked',
};

export function useTaskEngine({ projectId }: UseTaskEngineOptions): UseTaskEngineReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [activePhase, setActivePhase] = useState<Phase>('planning');
  const [phaseStatuses, setPhaseStatuses] = useState<Record<Phase, PhaseStatus>>(DEFAULT_PHASE_STATUSES);
  const [selectedFunnelType, setSelectedFunnelType] = useState<FunnelType | null>(null);

  // Use the funnel task injection hook
  const { 
    normalizeFunnelType,
    injectFunnelTasks, 
    handleFunnelTypeChange, 
    canChangeFunnelType: checkCanChangeFunnelType,
    getApplicableTemplates,
  } = useFunnelTaskInjection({ projectId });

  // Get applicable task templates based on funnel type (includes delta tasks)
  const applicableTemplates = useMemo(() => {
    return getApplicableTemplates(selectedFunnelType);
  }, [selectedFunnelType, getApplicableTemplates]);

  // Get task template by ID
  const getTaskTemplate = useCallback((taskId: string): TaskTemplate | undefined => {
    return TASK_TEMPLATES.find(t => t.taskId === taskId);
  }, []);

  // Check if all dependencies for a task are completed
  const areDependenciesCompleted = useCallback(
    (taskId: string): boolean => {
      const template = getTaskTemplate(taskId);
      if (!template || template.dependencies.length === 0) return true;

      return template.dependencies.every(depId => {
        const depTask = projectTasks.find(t => t.taskId === depId);
        return depTask?.status === 'completed';
      });
    },
    [projectTasks, getTaskTemplate]
  );

  // Calculate next best task using the algorithm
  const nextBestTask = useMemo((): NextBestTask | null => {
    // Get tasks for active phase that are applicable
    const phaseTasks = applicableTemplates.filter(t => t.phase === activePhase);
    
    // Find candidate tasks (not_started or in_progress, dependencies met)
    const candidateTasks = phaseTasks.filter(template => {
      const projectTask = projectTasks.find(pt => pt.taskId === template.taskId);
      const status = projectTask?.status || 'not_started';
      
      // Must be not_started or in_progress
      if (status !== 'not_started' && status !== 'in_progress') return false;
      
      // Dependencies must be completed
      return areDependenciesCompleted(template.taskId);
    });

    if (candidateTasks.length === 0) return null;

    // Step 1: If any task is in_progress, return the most recently updated one
    const inProgressTasks = candidateTasks.filter(template => {
      const projectTask = projectTasks.find(pt => pt.taskId === template.taskId);
      return projectTask?.status === 'in_progress';
    });

    if (inProgressTasks.length > 0) {
      // Sort by updatedAt descending
      const sorted = inProgressTasks.sort((a, b) => {
        const aTask = projectTasks.find(pt => pt.taskId === a.taskId);
        const bTask = projectTasks.find(pt => pt.taskId === b.taskId);
        const aTime = aTask?.updatedAt ? new Date(aTask.updatedAt).getTime() : 0;
        const bTime = bTask?.updatedAt ? new Date(bTask.updatedAt).getTime() : 0;
        return bTime - aTime;
      });
      const template = sorted[0];
      const projectTask = projectTasks.find(pt => pt.taskId === template.taskId);
      
      return {
        taskId: template.taskId,
        projectTaskId: projectTask?.id,
        title: template.title,
        phase: template.phase,
        route: template.route.replace(':id', projectId),
        estimatedTimeRange: `${template.estimatedMinutesMin}–${template.estimatedMinutesMax}`,
        whyItMatters: template.whyItMatters,
        isBlocking: template.blocking,
      };
    }

    // Step 2: Return earliest blocking task
    const blockingTasks = candidateTasks.filter(t => t.blocking);
    if (blockingTasks.length > 0) {
      const sorted = blockingTasks.sort((a, b) => a.order - b.order);
      const template = sorted[0];
      const projectTask = projectTasks.find(pt => pt.taskId === template.taskId);
      
      return {
        taskId: template.taskId,
        projectTaskId: projectTask?.id,
        title: template.title,
        phase: template.phase,
        route: template.route.replace(':id', projectId),
        estimatedTimeRange: `${template.estimatedMinutesMin}–${template.estimatedMinutesMax}`,
        whyItMatters: template.whyItMatters,
        isBlocking: true,
      };
    }

    // Step 3: Return lowest order task with tie-breakers
    const sorted = candidateTasks.sort((a, b) => {
      // Primary: order
      if (a.order !== b.order) return a.order - b.order;
      // Tie-breaker 1: lower estimated time
      const aTime = a.estimatedMinutesMin;
      const bTime = b.estimatedMinutesMin;
      if (aTime !== bTime) return aTime - bTime;
      // Tie-breaker 2: higher priority
      const aPriority = a.priority || 99;
      const bPriority = b.priority || 99;
      return aPriority - bPriority;
    });

    const template = sorted[0];
    const projectTask = projectTasks.find(pt => pt.taskId === template.taskId);
    
    return {
      taskId: template.taskId,
      projectTaskId: projectTask?.id,
      title: template.title,
      phase: template.phase,
      route: template.route.replace(':id', projectId),
      estimatedTimeRange: `${template.estimatedMinutesMin}–${template.estimatedMinutesMax}`,
      whyItMatters: template.whyItMatters,
      isBlocking: template.blocking,
    };
  }, [applicableTemplates, activePhase, projectTasks, projectId, areDependenciesCompleted]);

  // Check if a phase is complete
  const isPhaseComplete = useCallback(
    (phase: Phase): boolean => {
      const phaseTasks = applicableTemplates.filter(t => t.phase === phase);
      const requiredTasks = phaseTasks.filter(t => !t.canSkip);

      return requiredTasks.every(template => {
        const projectTask = projectTasks.find(pt => pt.taskId === template.taskId);
        return projectTask?.status === 'completed';
      });
    },
    [applicableTemplates, projectTasks]
  );

  // Update phase statuses based on completion
  const recalculatePhases = useCallback(async () => {
    const newStatuses: Record<Phase, PhaseStatus> = { ...DEFAULT_PHASE_STATUSES };
    let newActivePhase: Phase = 'planning'; // Track locally to avoid stale state
    let foundActive = false;

    for (const phase of PHASES) {
      if (isPhaseComplete(phase)) {
        newStatuses[phase] = 'complete';
      } else if (!foundActive) {
        newStatuses[phase] = 'active';
        foundActive = true;
        newActivePhase = phase; // Update local variable
      } else {
        newStatuses[phase] = 'locked';
      }
    }

    // If all phases are complete, set active_phase to 'post-launch'
    if (!foundActive) {
      newActivePhase = 'post-launch';
    }

    setActivePhase(newActivePhase);
    setPhaseStatuses(newStatuses);

    // Update project in database using local variable (not stale state)
    if (user) {
      await supabase
        .from('projects')
        .update({
          active_phase: newActivePhase,
          phase_statuses: newStatuses,
        })
        .eq('id', projectId)
        .eq('user_id', user.id);
    }
  }, [isPhaseComplete, projectId, user]);

  // Fetch project and tasks data
  const fetchData = useCallback(async () => {
    if (!user || !projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch project data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('active_phase, selected_funnel_type, phase_statuses')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (projectError) throw projectError;

      // Fetch project tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (tasksError) throw tasksError;

      // Map database results to ProjectTask type
      const mappedTasks: ProjectTask[] = (tasks || []).map(t => ({
        id: t.id,
        projectId: t.project_id,
        taskId: t.task_id,
        status: t.status as TaskStatus,
        inputData: t.input_data as Record<string, unknown> | undefined,
        skipReason: t.skip_reason as SkipReason | undefined,
        startedAt: t.started_at || undefined,
        completedAt: t.completed_at || undefined,
        updatedAt: t.updated_at,
        createdAt: t.created_at,
      }));

      // Backfill: If selected_funnel_type is null but the planning task has a selected value
      let effectiveFunnelType = project?.selected_funnel_type as FunnelType | null;
      
      if (!effectiveFunnelType) {
        const planningTask = mappedTasks.find(t => t.taskId === 'planning_choose_launch_path');
        if (planningTask?.status === 'completed' && planningTask.inputData?.selected) {
          const selectedFromTask = normalizeFunnelType(planningTask.inputData.selected as FunnelType) 
            || (planningTask.inputData.selected as FunnelType);
          
          // Update the project with the correct funnel type
          await supabase
            .from('projects')
            .update({ selected_funnel_type: selectedFromTask })
            .eq('id', projectId)
            .eq('user_id', user.id);
          
          // Inject any missing funnel tasks
          await injectFunnelTasks(selectedFromTask, mappedTasks);
          
          effectiveFunnelType = selectedFromTask;
        }
      }

      if (project) {
        setActivePhase((project.active_phase as Phase) || 'planning');
        setSelectedFunnelType(effectiveFunnelType);
        setPhaseStatuses(
          (project.phase_statuses as Record<Phase, PhaseStatus>) || DEFAULT_PHASE_STATUSES
        );
      }

      setProjectTasks(mappedTasks);
    } catch (err) {
      console.error('Error fetching task engine data:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user, projectId, normalizeFunnelType, injectFunnelTasks]);

  // Initialize tasks for a new project
  const initializeProjectTasks = useCallback(async () => {
    if (!user || !projectId || projectTasks.length > 0) return;

    // Create tasks for universal templates (planning AND messaging phases)
    const universalTasks = getUniversalTasks().filter(
      t => t.phase === 'planning' || t.phase === 'messaging'
    );
    
    for (const template of universalTasks) {
      const exists = projectTasks.find(pt => pt.taskId === template.taskId);
      if (!exists) {
        await supabase.from('project_tasks').insert({
          project_id: projectId,
          user_id: user.id,
          task_id: template.taskId,
          status: 'not_started',
        });
      }
    }
  }, [user, projectId, projectTasks]);

  // Start a task
  const startTask = useCallback(
    async (taskId: string) => {
      if (!user) return;

      const existingTask = projectTasks.find(pt => pt.taskId === taskId);

      if (existingTask) {
        await supabase
          .from('project_tasks')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .eq('id', existingTask.id)
          .eq('user_id', user.id);
      } else {
        await supabase.from('project_tasks').insert({
          project_id: projectId,
          user_id: user.id,
          task_id: taskId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        });
      }

      await fetchData();
    },
    [user, projectId, projectTasks, fetchData]
  );

  // Complete a task
  const completeTask = useCallback(
    async (taskId: string, inputData?: Record<string, unknown>) => {
      if (!user) return;

      const existingTask = projectTasks.find(pt => pt.taskId === taskId);
      const template = getTaskTemplate(taskId);

      if (existingTask) {
        await supabase
          .from('project_tasks')
          .update({
            status: 'completed',
            input_data: JSON.parse(JSON.stringify(inputData || existingTask.inputData || {})),
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingTask.id)
          .eq('user_id', user.id);
      } else {
        await supabase.from('project_tasks').insert([{
          project_id: projectId,
          user_id: user.id,
          task_id: taskId,
          status: 'completed',
          input_data: JSON.parse(JSON.stringify(inputData || {})),
          completed_at: new Date().toISOString(),
        }]);
      }

      // If this is the "Choose how you'll sell" task, set the funnel type and inject tasks
      if (taskId === 'planning_choose_launch_path' && inputData?.selected) {
        const selectedType = normalizeFunnelType(inputData.selected as FunnelType) || (inputData.selected as FunnelType);
        
        // Update project with selected funnel type
        const { error: funnelUpdateError } = await supabase
          .from('projects')
          .update({ selected_funnel_type: selectedType })
          .eq('id', projectId)
          .eq('user_id', user.id);

        if (funnelUpdateError) {
          console.error('Failed to update funnel type:', funnelUpdateError);
          throw new Error(`Failed to save funnel type "${selectedType}": ${funnelUpdateError.message}`);
        }

        // Inject funnel-specific tasks
        await injectFunnelTasks(selectedType, projectTasks);
        setSelectedFunnelType(selectedType);
      }

      // === AUTO STATUS TRANSITIONS ===
      // 1. First planning task completes → Draft → In Progress
      if (template?.phase === 'planning') {
        // Check if this is the first completed planning task
        const completedPlanningTasks = projectTasks.filter(
          pt => getTaskTemplate(pt.taskId)?.phase === 'planning' && pt.status === 'completed'
        );
        // If no planning tasks were completed before (this is the first one)
        if (completedPlanningTasks.length === 0) {
          // Transition from draft to in_progress silently
          await supabase
            .from('projects')
            .update({ status: 'in_progress' })
            .eq('id', projectId)
            .eq('user_id', user.id);
        }
      }

      // 2. Launch phase review completes → In Progress → Launched
      // This covers the final required launch task for all funnel types
      if (taskId === 'launch_phase_review') {
        await supabase
          .from('projects')
          .update({ status: 'launched' })
          .eq('id', projectId)
          .eq('user_id', user.id);
      }

      await fetchData();
      await recalculatePhases();
    },
    [user, projectId, projectTasks, fetchData, recalculatePhases, normalizeFunnelType, injectFunnelTasks, getTaskTemplate]
  );

  // Skip a task
  const skipTask = useCallback(
    async (taskId: string, reason: SkipReason) => {
      if (!user) return;

      const existingTask = projectTasks.find(pt => pt.taskId === taskId);

      if (existingTask) {
        await supabase
          .from('project_tasks')
          .update({
            status: 'skipped',
            skip_reason: reason,
          })
          .eq('id', existingTask.id)
          .eq('user_id', user.id);
      } else {
        await supabase.from('project_tasks').insert({
          project_id: projectId,
          user_id: user.id,
          task_id: taskId,
          status: 'skipped',
          skip_reason: reason,
        });
      }

      await fetchData();
      await recalculatePhases();
    },
    [user, projectId, projectTasks, fetchData, recalculatePhases]
  );

  // Select funnel type and inject funnel-specific tasks using the injection system
  const selectFunnelType = useCallback(
    async (funnelType: FunnelType) => {
      if (!user) return;

      // Normalize the funnel type (handle legacy types)
      const normalizedType = normalizeFunnelType(funnelType) || funnelType;

      // Check if we can change the funnel type
      if (selectedFunnelType && !checkCanChangeFunnelType(activePhase)) {
        console.warn('Cannot change funnel type during or after launch phase');
        return;
      }

      // Update project with the new funnel type
      await supabase
        .from('projects')
        .update({ selected_funnel_type: normalizedType })
        .eq('id', projectId)
        .eq('user_id', user.id);

      // Handle the change - this removes old funnel tasks and injects new ones
      if (selectedFunnelType && selectedFunnelType !== normalizedType) {
        await handleFunnelTypeChange(
          selectedFunnelType,
          normalizedType,
          projectTasks,
          activePhase
        );
      } else {
        // First time selecting - just inject
        await injectFunnelTasks(normalizedType, projectTasks);
      }

      // Also ensure messaging tasks exist
      const messagingTasks = getUniversalTasks().filter(t => t.phase === 'messaging');
      for (const template of messagingTasks) {
        const exists = projectTasks.find(pt => pt.taskId === template.taskId);
        if (!exists) {
          await supabase.from('project_tasks').insert({
            project_id: projectId,
            user_id: user.id,
            task_id: template.taskId,
            status: 'not_started',
          });
        }
      }

      setSelectedFunnelType(normalizedType);
      await fetchData();
    },
    [user, projectId, projectTasks, fetchData, selectedFunnelType, activePhase, 
     normalizeFunnelType, checkCanChangeFunnelType, handleFunnelTypeChange, injectFunnelTasks]
  );

  // Refresh tasks
  const refreshTasks = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recalculate phases once when tasks are first loaded
  const hasRecalculated = useRef(false);
  useEffect(() => {
    if (!isLoading && projectTasks.length > 0 && !hasRecalculated.current) {
      hasRecalculated.current = true;
      recalculatePhases();
    }
  }, [isLoading, projectTasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize project tasks if needed
  useEffect(() => {
    if (!isLoading && projectTasks.length === 0) {
      initializeProjectTasks();
    }
  }, [isLoading, projectTasks.length, initializeProjectTasks]);

  // Memoize whether funnel type can be changed
  const canChangeFunnelType = useMemo(() => {
    return checkCanChangeFunnelType(activePhase);
  }, [checkCanChangeFunnelType, activePhase]);

  return {
    isLoading,
    error,
    nextBestTask,
    activePhase,
    phaseStatuses,
    projectTasks,
    selectedFunnelType,
    getTaskTemplate,
    startTask,
    completeTask,
    skipTask,
    selectFunnelType,
    refreshTasks,
    canChangeFunnelType,
  };
}
