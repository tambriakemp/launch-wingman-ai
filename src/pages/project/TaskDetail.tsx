import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Clock, HelpCircle, Sparkles, Loader2, CheckCircle2, Check, Crown } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StuckHelpDialog } from "@/components/dashboard/StuckHelpDialog";
import { AIResponseRenderer } from "@/components/ui/ai-response-renderer";
import { FunnelDiagram } from "@/components/funnel/FunnelDiagram";
import { VoiceSnippetButton } from "@/components/ui/voice-snippet-button";
import { SimpleLaunchPageTask } from "@/components/build/SimpleLaunchPageTask";
import { VideoInstructionsSection } from "@/components/build/VideoInstructionsSection";
import { LAUNCH_PATH_FUNNEL_STEPS } from "@/data/launchPathFunnels";
import { toast } from "sonner";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { PHASE_LABELS, TaskTemplate } from "@/types/tasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLearnMoreArticleId } from "@/data/taskLearnMoreLinks";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { MVLCallout, MVLLaunchComplete } from "@/components/mvl";
import { PreLaunchIntro, PreLaunchComplete } from "@/components/prelaunch";
import { LaunchIntro, LaunchComplete } from "@/components/launch";
import { generateVoiceScript, hasVoiceSnippetSupport } from "@/lib/generateVoiceScript";
import { trackTaskCompletion, trackTaskStart, trackAIAssist } from "@/lib/analytics";
import { trackTaskComplete } from "@/lib/activityTracking";
import { ExportPlanButton } from "@/components/planning/ExportPlanButton";

export default function TaskDetail() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { tier, hasAdminAccess } = useFeatureAccess();
  const { isAdmin } = useAdmin();
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [completedCriteria, setCompletedCriteria] = useState<string[]>([]);
  const [isStuckDialogOpen, setIsStuckDialogOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [lastAiMode, setLastAiMode] = useState<string | null>(null);
  const [hasShownExamples, setHasShownExamples] = useState(false);
  const [showExampleText, setShowExampleText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showLaunchIntro, setShowLaunchIntro] = useState(false);
  const [showLaunchComplete, setShowLaunchComplete] = useState(false);
  const [showPreLaunchIntro, setShowPreLaunchIntro] = useState(false);
  const [showPreLaunchComplete, setShowPreLaunchComplete] = useState(false);
  const [mvlTransformationShown, setMvlTransformationShown] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const isInitialized = useRef(false);
  
  // Free funnel types - these are available to all users
  const FREE_FUNNEL_TYPES = ['content_to_offer', 'freebie_email_offer'];
  const isPro = tier === 'pro' || tier === 'admin' || hasAdminAccess;
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use task engine
  const {
    isLoading: engineLoading,
    getTaskTemplate,
    startTask,
    completeTask,
    projectTasks,
  } = useTaskEngine({ projectId: projectId || "" });

  // Get task template
  const taskTemplate = useMemo(() => {
    if (!taskId) return null;
    return getTaskTemplate(taskId);
  }, [taskId, getTaskTemplate]);

  // Get project task (if exists)
  const projectTask = useMemo(() => {
    if (!taskId) return null;
    return projectTasks.find(pt => pt.taskId === taskId);
  }, [taskId, projectTasks]);

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch offers for the planning review checklist (when viewing planning_phase_review task)
  const { data: projectOffers = [] } = useQuery({
    queryKey: ["offers-for-review", projectId, project?.selected_funnel_type],
    enabled: !!projectId && !!project?.selected_funnel_type && taskId === 'planning_phase_review',
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("id, title, offer_type, slot_type")
        .eq("project_id", projectId!)
        .eq("funnel_type", project!.selected_funnel_type)
        .order("slot_position");
      if (error) throw error;
      return data;
    },
  });

  // Funnel type labels for displaying launch path
  const FUNNEL_TYPE_LABELS: Record<string, string> = {
    content_to_offer: 'Content → Offer',
    freebie_email_offer: 'Freebie → Email → Offer',
    live_training_offer: 'Live Training → Offer',
    application_call: 'Application → Call',
    membership: 'Membership',
    challenge: 'Challenge',
    launch: 'Launch',
  };

  // Helper to truncate long text
  const truncateText = (text: string, maxLength: number = 120): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Get dynamic description for planning review checklist items
  const getChecklistItemDescription = useCallback((optionValue: string): React.ReactNode => {
    // Only process for planning_phase_review task
    if (taskId !== 'planning_phase_review') return null;

    const notDefinedText = <span className="italic text-muted-foreground/70">Not yet defined</span>;

    switch (optionValue) {
      case 'audience_reviewed': {
        const task = projectTasks.find(t => t.taskId === 'planning_define_audience');
        const inputData = task?.inputData as Record<string, unknown> | undefined;
        const value = inputData?.audience_description;
        return value ? String(value) : notDefinedText;
      }
      case 'problem_reviewed': {
        const task = projectTasks.find(t => t.taskId === 'planning_define_problem');
        const inputData = task?.inputData as Record<string, unknown> | undefined;
        const value = inputData?.primary_problem;
        return value ? String(value) : notDefinedText;
      }
      case 'outcome_reviewed': {
        const task = projectTasks.find(t => t.taskId === 'planning_define_dream_outcome');
        const inputData = task?.inputData as Record<string, unknown> | undefined;
        const value = inputData?.dream_outcome;
        return value ? String(value) : notDefinedText;
      }
      case 'time_effort_reviewed': {
        const task = projectTasks.find(t => t.taskId === 'planning_time_effort_perception');
        const inputData = task?.inputData as Record<string, unknown> | undefined;
        const items: string[] = [];
        if (inputData?.quick_wins) items.push(`Quick wins: ${String(inputData.quick_wins)}`);
        if (inputData?.friction_reducers) items.push(`Friction reducers: ${String(inputData.friction_reducers)}`);
        if (inputData?.effort_reframe) items.push(`Effort reframe: ${String(inputData.effort_reframe)}`);
        
        if (items.length === 0) return notDefinedText;
        return (
          <ul className="list-disc list-inside space-y-0.5 mt-1">
            {items.map((item, i) => <li key={i} className="text-sm">{item}</li>)}
          </ul>
        );
      }
      case 'belief_reviewed': {
        const task = projectTasks.find(t => t.taskId === 'planning_perceived_likelihood');
        const inputData = task?.inputData as Record<string, unknown> | undefined;
        const items: string[] = [];
        if (inputData?.belief_blockers) items.push(`Belief blockers: ${String(inputData.belief_blockers)}`);
        if (inputData?.belief_builders) items.push(`Belief builders: ${String(inputData.belief_builders)}`);
        if (inputData?.past_attempts) items.push(`Past attempts: ${String(inputData.past_attempts)}`);
        
        if (items.length === 0) return notDefinedText;
        return (
          <ul className="list-disc list-inside space-y-0.5 mt-1">
            {items.map((item, i) => <li key={i} className="text-sm">{item}</li>)}
          </ul>
        );
      }
      case 'offer_reviewed': {
        const configuredOffers = projectOffers.filter(o => o.offer_type?.trim());
        if (configuredOffers.length === 0) return <span className="italic text-muted-foreground/70">No offers configured yet</span>;
        
        return (
          <ul className="list-disc list-inside space-y-0.5 mt-1">
            {configuredOffers.map((offer) => (
              <li key={offer.id} className="text-sm">
                <span className="capitalize">{offer.slot_type?.replace('_', ' ') || 'Offer'}</span>: {offer.title || offer.offer_type}
              </li>
            ))}
          </ul>
        );
      }
      case 'path_reviewed': {
        const task = projectTasks.find(t => t.taskId === 'planning_choose_launch_path');
        const inputData = task?.inputData as Record<string, unknown> | undefined;
        const selected = inputData?.selected as string | undefined;
        if (!selected) return notDefinedText;
        return FUNNEL_TYPE_LABELS[selected] || selected;
      }
      default:
        return null;
    }
  }, [taskId, projectTasks, projectOffers]);

  // Load existing input data if available
  useEffect(() => {
    if (projectTask?.inputData) {
      const data = projectTask.inputData as Record<string, unknown>;
      setFormData(data as Record<string, string>);
      
      // Handle selection type
      if (taskTemplate?.inputType === 'selection' && data.selected) {
        setSelectedOption(data.selected as string);
      }
      
      // Handle checklist type
      if (taskTemplate?.inputType === 'checklist' && data.checkedItems) {
        setChecklistItems(Array.isArray(data.checkedItems) ? data.checkedItems : []);
      }
      
      // Load completed criteria if saved
      if (data.completedCriteria && Array.isArray(data.completedCriteria)) {
        setCompletedCriteria(data.completedCriteria as string[]);
      }
    }
    // Mark as initialized after loading data
    isInitialized.current = true;
  }, [projectTask, taskTemplate]);

  // Mark task as started when user opens it
  useEffect(() => {
    if (taskId && !projectTask && !engineLoading && taskTemplate) {
      startTask(taskId);
      trackTaskStart(taskTemplate.title);
    }
  }, [taskId, projectTask, engineLoading, startTask, taskTemplate]);

  // Check if this is first pre-launch or launch phase task and show intro
  useEffect(() => {
    if (!taskId || !taskTemplate || engineLoading) return;
    
    // Show pre-launch intro for first pre-launch task
    if (taskTemplate.phase === 'pre-launch') {
      const preLaunchPhaseTasks = projectTasks.filter(pt => {
        const template = getTaskTemplate(pt.taskId);
        return template?.phase === 'pre-launch' && (pt.status === 'completed' || pt.status === 'in_progress');
      });
      
      const preLaunchIntroKey = `prelaunch_intro_${projectId}`;
      const hasSeenIntro = localStorage.getItem(preLaunchIntroKey);
      
      if (preLaunchPhaseTasks.length === 0 && !hasSeenIntro) {
        setShowPreLaunchIntro(true);
      }
    }
    
    // Show launch intro for first launch task
    if (taskTemplate.phase === 'launch') {
      const launchPhaseTasks = projectTasks.filter(pt => {
        const template = getTaskTemplate(pt.taskId);
        return template?.phase === 'launch' && (pt.status === 'completed' || pt.status === 'in_progress');
      });
      
      const launchIntroKey = `mvl_launch_intro_${projectId}`;
      const hasSeenIntro = localStorage.getItem(launchIntroKey);
      
      if (launchPhaseTasks.length === 0 && !hasSeenIntro) {
        setShowLaunchIntro(true);
      }
    }
  }, [taskId, taskTemplate, engineLoading, projectTasks, projectId, getTaskTemplate]);

  // Auto-save function
  const saveInputData = useCallback(async () => {
    if (!user || !projectId || !taskId) return;

    // Build input data based on task type
    let inputData: Record<string, unknown> = {};
    
    switch (taskTemplate?.inputType) {
      case 'selection':
        inputData = { selected: selectedOption };
        break;
      case 'checklist':
        inputData = { checkedItems: checklistItems };
        break;
      case 'form':
        inputData = { ...formData };
        break;
    }

    // Check if there's meaningful data to save (excluding completedCriteria for this check)
    const hasData = Object.keys(inputData).some(key => {
      const value = inputData[key];
      if (Array.isArray(value)) return value.length > 0;
      return value && String(value).trim() !== '';
    });

    if (!hasData) return;

    // IMPORTANT: Always include completedCriteria in the saved data to prevent overwrites
    inputData.completedCriteria = completedCriteria;

    try {
      const existingTask = projectTasks.find(pt => pt.taskId === taskId);

      if (existingTask) {
        // Merge with existing data to avoid losing any fields
        const existingData = (existingTask.inputData as Record<string, unknown>) || {};
        const mergedData = { ...existingData, ...inputData };
        
        // Update existing task - preserve status, just update input_data
        await supabase
          .from('project_tasks')
          .update({
            input_data: JSON.parse(JSON.stringify(mergedData)),
          })
          .eq('id', existingTask.id)
          .eq('user_id', user.id);
      } else {
        // Create new task as in_progress with input_data
        await supabase.from('project_tasks').insert({
          project_id: projectId,
          user_id: user.id,
          task_id: taskId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          input_data: JSON.parse(JSON.stringify(inputData)),
        });
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [user, projectId, taskId, taskTemplate, selectedOption, checklistItems, formData, projectTasks, completedCriteria]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!isInitialized.current || !projectId || !taskId || !user) return;

    // Clear any pending save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Check if there's any data to save
    const hasData = Object.keys(formData).some(k => typeof formData[k] === 'string' && formData[k]?.trim()) || 
                    selectedOption || 
                    checklistItems.length > 0;

    if (!hasData) return;

    setAutoSaveStatus('saving');

    autoSaveTimeoutRef.current = setTimeout(async () => {
      await saveInputData();
      setAutoSaveStatus('saved');
      
      // Reset to idle after 2 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }, 800);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, selectedOption, checklistItems, projectId, taskId, user, saveInputData]);

  const handleCriteriaToggle = useCallback(async (criteriaText: string) => {
    const newCriteria = completedCriteria.includes(criteriaText)
      ? completedCriteria.filter((c) => c !== criteriaText)
      : [...completedCriteria, criteriaText];
    
    setCompletedCriteria(newCriteria);
    
    // Persist to database immediately
    if (user && projectId && taskId) {
      try {
        const existingTask = projectTasks.find(pt => pt.taskId === taskId);
        const existingData = (existingTask?.inputData as Record<string, unknown>) || {};
        const updatedData = { ...existingData, completedCriteria: newCriteria };
        
        if (existingTask) {
          await supabase
            .from('project_tasks')
            .update({ input_data: updatedData })
            .eq('id', existingTask.id)
            .eq('user_id', user.id);
        } else {
          await supabase.from('project_tasks').insert({
            project_id: projectId,
            user_id: user.id,
            task_id: taskId,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            input_data: updatedData,
          });
        }
      } catch (error) {
        console.error('Error saving completion criteria:', error);
      }
    }
  }, [completedCriteria, user, projectId, taskId, projectTasks]);

  const handleChecklistToggle = (value: string) => {
    setChecklistItems((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check if all completion criteria are checked
  const allCriteriaComplete = useMemo(() => {
    if (!taskTemplate) return false;
    return completedCriteria.length === taskTemplate.completionCriteria.length;
  }, [taskTemplate, completedCriteria]);

  const isTaskComplete = useMemo(() => {
    if (!taskTemplate) return false;
    
    // First check if input requirements are met
    let inputComplete = false;
    switch (taskTemplate.inputType) {
      case 'selection':
        inputComplete = !!selectedOption;
        break;
      case 'checklist':
        const requiredCount = taskTemplate.inputSchema?.options?.length || 0;
        inputComplete = checklistItems.length >= requiredCount;
        break;
      case 'form':
        const fields = taskTemplate.inputSchema?.fields || [];
        const requiredFields = fields.filter(f => f.required);
        inputComplete = requiredFields.every(f => formData[f.name]?.trim());
        break;
      case 'custom':
        // SimpleLaunchPageTask requires 3 checklist items
        if (taskTemplate.inputSchema?.customComponent === 'SimpleLaunchPageTask') {
          inputComplete = checklistItems.length >= 3;
        } else {
          inputComplete = true;
        }
        break;
      default:
        inputComplete = true;
    }
    
    // Task is only complete when both input is filled AND all criteria are checked
    return inputComplete && allCriteriaComplete;
  }, [taskTemplate, selectedOption, checklistItems, formData, allCriteriaComplete]);

  // Check if this is a custom component with its own completion UI
  const hasCustomCompletionUI = taskTemplate?.inputType === 'custom' && 
    taskTemplate?.inputSchema?.customComponent === 'SimpleLaunchPageTask';

  const handleSaveAndComplete = async () => {
    if (!isTaskComplete || !taskId) {
      toast.error("Please complete the required fields before continuing");
      return;
    }

    setIsSaving(true);

    try {
      // Build input data based on task type
      let inputData: Record<string, unknown> = {};
      
      switch (taskTemplate?.inputType) {
        case 'selection':
          inputData = { selected: selectedOption };
          break;
        case 'checklist':
          inputData = { checkedItems: checklistItems };
          break;
        case 'form':
          inputData = { ...formData };
          break;
      }
      
      // IMPORTANT: Always include completedCriteria to persist checkboxes
      inputData.completedCriteria = completedCriteria;

      await completeTask(taskId, inputData);
      
      // Track task completion with Google Analytics
      trackTaskCompletion(taskTemplate?.title || taskId);
      
      // Track task completion to backend activity log
      trackTaskComplete(taskId, taskTemplate?.title || taskId);
      
      // MVL: Show transformation statement confirmation (placement #2)
      if (taskId === 'messaging_transformation_statement') {
        setMvlTransformationShown(true);
        toast.success("Great work! Task saved and marked complete.");
        // Brief pause to show MVL message before navigating
        setTimeout(() => {
          navigate(`/projects/${projectId}/dashboard`);
        }, 2500);
        return;
      }
      
      // Pre-Launch: Show completion confirmation
      if (taskId === 'prelaunch_share_signal') {
        setShowPreLaunchComplete(true);
        setTimeout(() => {
          navigate(`/projects/${projectId}/dashboard`);
        }, 3000);
        return;
      }
      
      // Launch: Show completion confirmation for One-Post Launch task
      if (taskId === 'launch_share_offer_once') {
        setShowLaunchComplete(true);
        setTimeout(() => {
          navigate(`/projects/${projectId}/dashboard`);
        }, 3000);
        return;
      }
      
      toast.success("Great work! Task saved and marked complete.");
      navigate(`/projects/${projectId}/dashboard`);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle dismissing launch intro
  const handleLaunchIntroContinue = () => {
    const launchIntroKey = `mvl_launch_intro_${projectId}`;
    localStorage.setItem(launchIntroKey, 'true');
    setShowLaunchIntro(false);
  };

  // Handle dismissing pre-launch intro
  const handlePreLaunchIntroContinue = () => {
    const preLaunchIntroKey = `prelaunch_intro_${projectId}`;
    localStorage.setItem(preLaunchIntroKey, 'true');
    setShowPreLaunchIntro(false);
  };

  // Get the primary input value for Help Me Choose mode detection
  const getPrimaryInputValue = (): string => {
    if (!taskTemplate) return '';
    
    switch (taskTemplate.inputType) {
      case 'selection':
        return selectedOption || '';
      case 'form':
        // Get the first textarea or text field value
        const fields = taskTemplate.inputSchema?.fields || [];
        const primaryField = fields.find(f => f.type === 'textarea') || fields[0];
        if (primaryField) {
          return formData[primaryField.name] || '';
        }
        return '';
      default:
        return '';
    }
  };

  const handleAiAssist = async (mode: string) => {
    if (!taskTemplate || !projectId) return;
    
    setIsAiLoading(mode);
    setAiResponse(null);
    setLastAiMode(mode);
    
    try {
      // Get current input value for mode detection (all AI modes can use it)
      const currentInput = getPrimaryInputValue();
      
      // Get niche context if available (for audience task)
      const nicheContext = formData['niche_context'] || undefined;
      
      const { data, error } = await supabase.functions.invoke('task-ai-assist', {
        body: {
          mode,
          taskId: taskTemplate.taskId,
          taskTitle: taskTemplate.title,
          taskInstructions: taskTemplate.instructions,
          projectId,
          currentInput,
          nicheContext,
        },
      });

      if (error) {
        console.error('AI assist error:', error);
        throw error;
      }

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else if (data.error.includes('usage limit')) {
          toast.error('AI usage limit reached. Please try again later.');
        } else {
          toast.error('Failed to get AI help. Please try again.');
        }
        return;
      }

      setAiResponse(JSON.stringify(data));
      
      // Track AI assist with Google Analytics
      trackAIAssist(`${taskTemplate?.taskId || 'task'}_${mode}`);
      
      // Track that examples have been shown
      if (mode === 'examples') {
        setHasShownExamples(true);
      }
    } catch (error) {
      console.error('AI assist error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsAiLoading(null);
    }
  };

  if (engineLoading || !taskTemplate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your task...</span>
        </div>
      </div>
    );
  }

  const phaseLabel = PHASE_LABELS[taskTemplate.phase] || taskTemplate.phase;
  const timeRange = `${taskTemplate.estimatedMinutesMin}–${taskTemplate.estimatedMinutesMax} minutes`;
  
  // Pre-Launch: Show intro screen
  if (showPreLaunchIntro) {
    return (
      <div className="min-h-screen bg-background">
        <PreLaunchIntro onContinue={handlePreLaunchIntroContinue} />
      </div>
    );
  }

  // Pre-Launch: Show completion screen
  if (showPreLaunchComplete) {
    return (
      <div className="min-h-screen bg-background">
        <PreLaunchComplete />
      </div>
    );
  }
  
  // Launch: Show intro screen
  if (showLaunchIntro) {
    return (
      <div className="min-h-screen bg-background">
        <LaunchIntro onContinue={handleLaunchIntroContinue} />
      </div>
    );
  }
  
  // Launch: Show complete screen
  if (showLaunchComplete) {
    return (
      <div className="min-h-screen bg-background">
        <LaunchComplete />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header / Context Section */}
        <div className="mb-10">
          <Link
            to={`/projects/${projectId}/dashboard`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {phaseLabel} Phase
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Estimated time: {timeRange}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {taskTemplate.title}
          </h1>
          
          {/* Learn more link - only shown for specific tasks */}
          {getLearnMoreArticleId(taskTemplate.taskId) && (
            <Link
              to={`/projects/${projectId}/library?article=${getLearnMoreArticleId(taskTemplate.taskId)}&returnTo=${encodeURIComponent(location.pathname)}`}
              className="text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              Learn more
            </Link>
          )}
        </div>

        {/* Why This Matters Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Why this matters
            </h2>
            {hasVoiceSnippetSupport(taskTemplate.taskId, taskTemplate.whyItMatters) && (
              <VoiceSnippetButton
                taskId={taskTemplate.taskId}
                script={generateVoiceScript(taskTemplate.taskId, taskTemplate.whyItMatters, taskTemplate.instructions?.join(' ')) || ''}
              />
            )}
          </div>
          <p className="text-foreground/80 leading-relaxed">
            {taskTemplate.whyItMatters}
          </p>
        </section>


        <div className="h-px bg-border mb-10" />

        {/* What to Do Section */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            What to do
          </h2>
          <ol className="space-y-3">
            {taskTemplate.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <span className="text-foreground/80 pt-0.5">{instruction}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Video Instructions Section */}
        <VideoInstructionsSection taskId={taskId || ''} isAdmin={isAdmin} />

        <div className="h-px bg-border mb-10" />

        {/* Task Input Area */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Your response
              </h2>
              {taskId === 'planning_phase_review' && project && (
                <ExportPlanButton 
                  projectName={project.name}
                  projectTasks={projectTasks}
                  offers={projectOffers}
                  selectedFunnelType={project.selected_funnel_type}
                />
              )}
            </div>
            {/* Auto-save status indicator */}
            {autoSaveStatus !== 'idle' && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {autoSaveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    Saved
                  </>
                )}
              </span>
            )}
          </div>
          
          {/* Selection Input */}
          {taskTemplate.inputType === 'selection' && taskTemplate.inputSchema?.options && (
            <div className="space-y-4">
              {/* Optional prompt text from schema */}
              {taskTemplate.inputSchema.prompt && (
                <p className="text-muted-foreground text-sm">
                  {taskTemplate.inputSchema.prompt}
                </p>
              )}
              
              <RadioGroup value={selectedOption} onValueChange={(value) => {
                // Check if this funnel type is locked
                const isLocked = !isPro && !FREE_FUNNEL_TYPES.includes(value);
                if (isLocked) {
                  setShowUpgradeDialog(true);
                  return;
                }
                setSelectedOption(value);
              }} className="space-y-3">
                {taskTemplate.inputSchema.options.map((option) => {
                  const funnelConfig = LAUNCH_PATH_FUNNEL_STEPS[option.value];
                  const isSelected = selectedOption === option.value;
                  const isLocked = !isPro && !FREE_FUNNEL_TYPES.includes(option.value);
                  
                  return (
                    <div key={option.value}>
                      <Label
                        htmlFor={option.value}
                        className={`flex flex-col p-4 rounded-lg border transition-all ${
                          isLocked 
                            ? "cursor-not-allowed opacity-60 border-border bg-muted/20"
                            : isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary cursor-pointer"
                              : "border-border hover:border-muted-foreground/30 hover:bg-muted/30 cursor-pointer"
                        }`}
                        onClick={(e) => {
                          if (isLocked) {
                            e.preventDefault();
                            setShowUpgradeDialog(true);
                          }
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <RadioGroupItem 
                            value={option.value} 
                            id={option.value} 
                            className="mt-0.5" 
                            disabled={isLocked}
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                                {option.label}
                              </span>
                              {isLocked && (
                                <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className={`text-sm leading-relaxed ${isLocked ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                              {option.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Expandable Funnel Diagram */}
                        <AnimatePresence>
                          {isSelected && funnelConfig && !isLocked && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <FunnelDiagram
                                  steps={funnelConfig.steps}
                                  color={funnelConfig.color}
                                  bgColor={funnelConfig.bgColor}
                                />
                                <p className="text-xs text-muted-foreground text-center mt-3">
                                  Offer Slots: {funnelConfig.offerSlots}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              
              {/* Optional helper text from schema */}
              {taskTemplate.inputSchema.helperText && (
                <p className="text-muted-foreground/80 text-xs italic">
                  {taskTemplate.inputSchema.helperText}
                </p>
              )}
            </div>
          )}

          {/* Checklist Input */}
          {taskTemplate.inputType === 'checklist' && taskTemplate.inputSchema?.options && (
            <div className="space-y-3">
              {taskTemplate.inputSchema.options.map((option) => {
                // Get dynamic description for planning review checklist
                const dynamicDescription = getChecklistItemDescription(option.value);
                
                return (
                  <div
                    key={option.value}
                    className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                      checklistItems.includes(option.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                    }`}
                    onClick={() => handleChecklistToggle(option.value)}
                  >
                    <Checkbox
                      id={option.value}
                      checked={checklistItems.includes(option.value)}
                      onCheckedChange={() => handleChecklistToggle(option.value)}
                      className="mt-0.5"
                    />
                    <div className="space-y-1 flex-1">
                      <Label htmlFor={option.value} className="font-medium text-foreground cursor-pointer">
                        {option.label}
                      </Label>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {dynamicDescription || option.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form Input */}
          {taskTemplate.inputType === 'form' && taskTemplate.inputSchema?.fields && (
            <div className="space-y-6">
              {taskTemplate.inputSchema.fields.map((field, index) => {
                // Check if this field has a section label (indicates a new optional section)
                const hasSection = !!field.sectionLabel;
                
                return (
                  <div key={field.name}>
                    {/* Optional Section Header */}
                    {hasSection && (
                      <div className="mt-8 mb-4 pt-6 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {field.sectionLabel}
                        </p>
                      </div>
                    )}
                    
                    <div className={`space-y-2 ${hasSection ? 'opacity-80' : ''}`}>
                      <Label htmlFor={field.name} className={`text-sm ${hasSection ? 'font-normal text-muted-foreground' : 'font-medium'}`}>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={field.name}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFormChange(field.name, e.target.value)}
                          className="min-h-[120px]"
                        />
                      ) : field.type === 'select' && field.options ? (
                        <Select
                          value={formData[field.name] || ''}
                          onValueChange={(value) => handleFormChange(field.name, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={field.placeholder || 'Select...'} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.filter(opt => opt.value !== '').map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFormChange(field.name, e.target.value)}
                        />
                      )}
                      
                      {/* Helper text for optional fields */}
                      {field.helperText && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {field.helperText}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Component: SimpleLaunchPageTask */}
          {taskTemplate.inputType === 'custom' && taskTemplate.inputSchema?.customComponent === 'SimpleLaunchPageTask' && (
            <SimpleLaunchPageTask
              formData={formData}
              checklistItems={checklistItems}
              onChecklistToggle={handleChecklistToggle}
              onComplete={handleSaveAndComplete}
              isCompleting={isSaving}
            />
          )}
        </section>

        {/* AI Assist Section */}
        {taskTemplate.aiAssistModes.length > 0 && (
          <section className="mb-10 p-5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-medium text-foreground">Need help?</h2>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {taskTemplate.aiAssistModes.map((mode) => {
                const labels: Record<string, string> = {
                  help_me_choose: "Help me choose",
                  examples: hasShownExamples ? "Show more examples" : "Show examples",
                  simplify: "Simplify this",
                };
                
                // Simplify button requires user input
                const primaryInput = getPrimaryInputValue();
                const hasInput = primaryInput.trim().length >= 10; // At least one meaningful sentence
                const isSimplifyDisabled = mode === 'simplify' && !hasInput;
                
                return (
                  <Button
                    key={mode}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAiAssist(mode)}
                    disabled={isAiLoading !== null || isSimplifyDisabled}
                    title={isSimplifyDisabled ? "Write something first so we can simplify it." : undefined}
                  >
                    {isAiLoading === mode && (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    )}
                    {labels[mode] || mode}
                  </Button>
                );
              })}
            </div>
            
            {/* Helper text for simplify when disabled */}
            {taskTemplate.aiAssistModes.includes('simplify') && getPrimaryInputValue().trim().length < 10 && (
              <p className="text-xs text-muted-foreground mb-4">
                Write something first so we can simplify it.
              </p>
            )}

            {aiResponse && (
              <AIResponseRenderer response={aiResponse} mode={lastAiMode || undefined} />
            )}
          </section>
        )}

        {/* Collapsible Example Text (if available) */}
        {taskTemplate.exampleText && (
          <section className="mb-10">
            <button
              type="button"
              onClick={() => setShowExampleText(!showExampleText)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>See an example</span>
              {showExampleText ? (
                <span className="text-xs">▲</span>
              ) : (
                <span className="text-xs">▼</span>
              )}
            </button>
            
            <AnimatePresence>
              {showExampleText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {taskTemplate.exampleText}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {!hasCustomCompletionUI && (
          <>
            <div className="h-px bg-border mb-10" />

            {/* "This Is Enough" Reinforcement Callout for Launch task */}
            {taskId === 'launch_share_offer_once' && (
              <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-foreground font-medium mb-1">
                  This counts as a launch.
                </p>
                <p className="text-sm text-muted-foreground">
                  One clear share is enough for this step.
                </p>
              </div>
            )}

            {/* What Done Looks Like Section */}
            <section className="mb-10">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                This step is complete when:
              </h2>
              
              <div className="space-y-3">
                {taskTemplate.completionCriteria.map((criteria, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 group"
                  >
                    <Checkbox
                      id={`criteria-${index}`}
                      checked={completedCriteria.includes(criteria)}
                      onCheckedChange={() => handleCriteriaToggle(criteria)}
                      className="cursor-pointer"
                    />
                    <Label
                      htmlFor={`criteria-${index}`}
                      className={`flex-1 text-sm cursor-pointer transition-colors ${
                        completedCriteria.includes(criteria)
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {criteria}
                    </Label>
                  </div>
                ))}
              </div>
              
              {/* Note about requirement */}
              {!allCriteriaComplete && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Check off all items above before saving and marking complete.
                </p>
              )}

              {isTaskComplete && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    You're ready to save and continue!
                  </p>
                </div>
              )}
              
              {/* MVL: Planning Phase Review callout (placement #1) */}
              {taskId === 'planning_phase_review' && isTaskComplete && (
                <MVLCallout variant="planning" className="mt-6" />
              )}
              
              {/* MVL: Transformation Statement inline confirmation (placement #2) */}
              {taskId === 'messaging_transformation_statement' && mvlTransformationShown && (
                <MVLCallout variant="transformation" className="mt-6" />
              )}
            </section>

            {/* Completion Action */}
            <section className="mb-12">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleSaveAndComplete}
                disabled={!isTaskComplete || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & mark complete →"
                )}
              </Button>
            </section>
          </>
        )}

        <div className="h-px bg-border mb-10" />

        {/* I'm Stuck Support Section */}
        <section className="text-center pb-8">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm">Still stuck?</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Not sure how to move forward? Get help with this step.
            </p>
            <Button
              variant="outline"
              onClick={() => setIsStuckDialogOpen(true)}
            >
              I'm stuck
            </Button>
          </div>
        </section>
      </div>

      {/* Stuck Help Dialog */}
      <StuckHelpDialog
        open={isStuckDialogOpen}
        onOpenChange={setIsStuckDialogOpen}
        currentTask={{
          title: taskTemplate.title,
          whyItMatters: taskTemplate.whyItMatters,
        }}
        projectContext={`Project: ${project?.name || 'My Project'}`}
      />
      
      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature="Advanced funnel types"
      />
    </div>
  );
}