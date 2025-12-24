import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Phase,
  PHASES,
  PHASE_LABELS,
  TaskStatus,
  PhaseStatus,
  ProjectTask,
  NextBestTask,
  TaskTemplate,
  FunnelType,
  SkipReason,
} from '@/types/tasks';
import { TASK_TEMPLATES, getTasksForFunnelType, getUniversalTasks } from '@/data/taskTemplates';

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

  // Get applicable task templates based on funnel type
  const applicableTemplates = useMemo(() => {
    if (!selectedFunnelType) {
      return getUniversalTasks();
    }
    return getTasksForFunnelType(selectedFunnelType);
  }, [selectedFunnelType]);

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
    let foundActive = false;

    for (const phase of PHASES) {
      if (isPhaseComplete(phase)) {
        newStatuses[phase] = 'complete';
      } else if (!foundActive) {
        newStatuses[phase] = 'active';
        foundActive = true;
        setActivePhase(phase);
      } else {
        newStatuses[phase] = 'locked';
      }
    }

    setPhaseStatuses(newStatuses);

    // Update project in database
    if (user) {
      await supabase
        .from('projects')
        .update({
          active_phase: foundActive ? activePhase : 'planning',
          phase_statuses: newStatuses,
        })
        .eq('id', projectId)
        .eq('user_id', user.id);
    }
  }, [isPhaseComplete, projectId, user, activePhase]);

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

      if (project) {
        setActivePhase((project.active_phase as Phase) || 'planning');
        setSelectedFunnelType(project.selected_funnel_type as FunnelType | null);
        setPhaseStatuses(
          (project.phase_statuses as Record<Phase, PhaseStatus>) || DEFAULT_PHASE_STATUSES
        );
      }

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

      setProjectTasks(mappedTasks);
    } catch (err) {
      console.error('Error fetching task engine data:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user, projectId]);

  // Initialize tasks for a new project
  const initializeProjectTasks = useCallback(async () => {
    if (!user || !projectId || projectTasks.length > 0) return;

    // Create tasks for universal templates (planning phase)
    const universalTasks = getUniversalTasks().filter(t => t.phase === 'planning');
    
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

      await fetchData();
      await recalculatePhases();
    },
    [user, projectId, projectTasks, fetchData, recalculatePhases]
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

  // Select funnel type and generate funnel-specific tasks
  const selectFunnelType = useCallback(
    async (funnelType: FunnelType) => {
      if (!user) return;

      // Update project
      await supabase
        .from('projects')
        .update({ selected_funnel_type: funnelType })
        .eq('id', projectId)
        .eq('user_id', user.id);

      setSelectedFunnelType(funnelType);

      // Generate funnel-specific tasks for build, content, launch, post-launch phases
      const funnelTasks = getTasksForFunnelType(funnelType).filter(
        t => t.phase !== 'planning' && t.phase !== 'messaging'
      );

      for (const template of funnelTasks) {
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

      await fetchData();
    },
    [user, projectId, projectTasks, fetchData]
  );

  // Refresh tasks
  const refreshTasks = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize project tasks if needed
  useEffect(() => {
    if (!isLoading && projectTasks.length === 0) {
      initializeProjectTasks();
    }
  }, [isLoading, projectTasks.length, initializeProjectTasks]);

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
  };
}
