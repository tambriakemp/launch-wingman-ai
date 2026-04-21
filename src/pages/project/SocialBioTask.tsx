import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { PHASE_LABELS } from "@/types/tasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SocialBioBuilder } from "@/components/SocialBioBuilder";

export default function SocialBioTask() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const taskId = 'messaging_social_bio';
  
  const [completedCriteria, setCompletedCriteria] = useState<string[]>([]);
  const [biosCount, setBiosCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    isLoading: engineLoading,
    getTaskTemplate,
    completeTask,
    projectTasks,
  } = useTaskEngine({ projectId: projectId || "" });

  const taskTemplate = useMemo(() => {
    return getTaskTemplate(taskId);
  }, [getTaskTemplate]);

  const projectTask = useMemo(() => {
    return projectTasks.find(pt => pt.taskId === taskId);
  }, [projectTasks]);

  // Fetch initial bios count on mount (no polling)
  const { data: initialBiosCount = 0 } = useQuery({
    queryKey: ["social-bios-count", projectId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("social_bios")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!projectId,
    staleTime: Infinity, // Don't refetch automatically, rely on callback
  });

  // Initialize state from projectTask.input_data on mount
  useEffect(() => {
    if (projectTask && !isInitialized) {
      const inputData = projectTask.inputData as { completedCriteria?: string[]; biosCreated?: number } | null;
      if (inputData?.completedCriteria) {
        setCompletedCriteria(inputData.completedCriteria);
      }
      setIsInitialized(true);
    }
  }, [projectTask, isInitialized]);

  // Set initial bios count
  useEffect(() => {
    if (initialBiosCount > 0 && biosCount === 0) {
      setBiosCount(initialBiosCount);
    }
  }, [initialBiosCount, biosCount]);

  // Callback from SocialBioBuilder when bios change
  const handleBiosChange = useCallback((count: number) => {
    setBiosCount(count);
  }, []);

  // Auto-save criteria to input_data when toggled
  const saveCriteriaToTask = useCallback(async (criteria: string[]) => {
    if (!projectId || !user?.id) return;
    
    try {
      await supabase
        .from("project_tasks")
        .update({ 
          input_data: { completedCriteria: criteria, biosCreated: biosCount },
          updated_at: new Date().toISOString()
        })
        .eq("project_id", projectId)
        .eq("task_id", taskId);
    } catch (error) {
      console.error("Failed to auto-save criteria:", error);
    }
  }, [projectId, user?.id, biosCount]);

  const handleCriteriaToggle = (criteriaText: string) => {
    setCompletedCriteria((prev) => {
      const newCriteria = prev.includes(criteriaText)
        ? prev.filter((c) => c !== criteriaText)
        : [...prev, criteriaText];
      
      // Auto-save after state update
      saveCriteriaToTask(newCriteria);
      return newCriteria;
    });
  };

  const hasBios = biosCount > 0;
  const criteriaCount = completedCriteria.length;
  const totalCriteria = taskTemplate?.completionCriteria?.length || 0;
  const allCriteriaComplete = totalCriteria > 0 && criteriaCount === totalCriteria;

  const handleSaveAndComplete = async () => {
    if (!hasBios) {
      toast.error("Please create at least one bio before completing this task");
      return;
    }

    setIsSaving(true);

    try {
      await completeTask(taskId, { 
        biosCreated: biosCount,
        completedCriteria 
      });
      
      toast.success("Great work! Task saved and marked complete.");
      navigate(`/projects/${projectId}/dashboard`);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveForLater = async () => {
    // Save current progress before navigating
    await saveCriteriaToTask(completedCriteria);
    toast.success("Progress saved");
    navigate(`/projects/${projectId}/dashboard`);
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

  const timeRange = `${taskTemplate.estimatedMinutesMin}–${taskTemplate.estimatedMinutesMax} minutes`;

  return (
    <EditorialTaskShell
      projectId={projectId!}
      taskId="messaging_social_bio"
      phase={taskTemplate.phase}
      title={taskTemplate.title}
      whyItMatters={taskTemplate.whyItMatters}
      instructions={taskTemplate.instructions}
      estimatedTimeRange={timeRange}
      footer={
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSaveAndComplete}
            disabled={!hasBios || isSaving}
            className="flex-1 gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save & Complete
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleSaveForLater} className="sm:w-auto">
            Save for Later
          </Button>
        </div>
      }
    >
      {projectId && (
        <SocialBioBuilder projectId={projectId} onBiosChange={handleBiosChange} />
      )}

      <div className="h-px bg-hairline my-10" />

      <div>
        <h2 className="editorial-eyebrow mb-4">Before you finish</h2>
        <div className="space-y-3">
          {taskTemplate.completionCriteria.map((criteria, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border border-hairline bg-white"
            >
              <Checkbox
                id={`criteria-${index}`}
                checked={completedCriteria.includes(criteria)}
                onCheckedChange={() => handleCriteriaToggle(criteria)}
                className="mt-0.5"
              />
              <Label
                htmlFor={`criteria-${index}`}
                className="text-sm text-ink-800 cursor-pointer leading-relaxed"
              >
                {criteria}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </EditorialTaskShell>
  );
}
  const timeRange = `${taskTemplate.estimatedMinutesMin}–${taskTemplate.estimatedMinutesMax} minutes`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
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
        </div>

        {/* Why This Matters */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Why this matters
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            {taskTemplate.whyItMatters}
          </p>
        </section>

        <div className="h-px bg-border mb-10" />

        {/* What to Do */}
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

        <div className="h-px bg-border mb-10" />

        {/* Your Response - SocialBioBuilder embedded */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Your response
          </h2>
          
          {projectId && (
            <SocialBioBuilder 
              projectId={projectId} 
              onBiosChange={handleBiosChange}
            />
          )}
        </section>

        <div className="h-px bg-border mb-10" />

        {/* Completion Criteria */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Before you finish
          </h2>
          <div className="space-y-3">
            {taskTemplate.completionCriteria.map((criteria, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <Checkbox
                  id={`criteria-${index}`}
                  checked={completedCriteria.includes(criteria)}
                  onCheckedChange={() => handleCriteriaToggle(criteria)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`criteria-${index}`}
                  className="text-sm text-foreground/80 cursor-pointer leading-relaxed"
                >
                  {criteria}
                </Label>
              </div>
            ))}
          </div>
        </section>


        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={handleSaveAndComplete}
            disabled={!hasBios || isSaving}
            className="flex-1 gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save & Complete
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveForLater}
            className="sm:w-auto"
          >
            Save for Later
          </Button>
        </div>
      </div>
    </div>
  );
}
