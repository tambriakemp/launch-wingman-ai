import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { PHASE_LABELS } from "@/types/tasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SalesPageCopyTab } from "@/components/content/sales-copy";
import { VoiceSnippetButton } from "@/components/ui/voice-snippet-button";
import { generateVoiceScript } from "@/lib/generateVoiceScript";

export default function SalesCopyTask() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const taskId = 'messaging_sales_copy';
  
  const [completedCriteria, setCompletedCriteria] = useState<string[]>([]);
  const [salesCopyCount, setSalesCopyCount] = useState(0);
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

  // Fetch sales copy count on mount
  const { data: initialSalesCopyCount = 0 } = useQuery({
    queryKey: ["sales-copy-count", projectId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("sales_page_copy")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!projectId,
    staleTime: Infinity,
  });

  // Initialize state from projectTask.input_data on mount
  useEffect(() => {
    if (projectTask && !isInitialized) {
      const inputData = projectTask.inputData as { completedCriteria?: string[]; salesCopyCount?: number } | null;
      if (inputData?.completedCriteria) {
        setCompletedCriteria(inputData.completedCriteria);
      }
      setIsInitialized(true);
    }
  }, [projectTask, isInitialized]);

  // Set initial sales copy count
  useEffect(() => {
    if (initialSalesCopyCount > 0 && salesCopyCount === 0) {
      setSalesCopyCount(initialSalesCopyCount);
    }
  }, [initialSalesCopyCount, salesCopyCount]);

  // Auto-save criteria to input_data when toggled
  const saveCriteriaToTask = useCallback(async (criteria: string[]) => {
    if (!projectId || !user?.id) return;
    
    try {
      await supabase
        .from("project_tasks")
        .update({ 
          input_data: { completedCriteria: criteria, salesCopyCount },
          updated_at: new Date().toISOString()
        })
        .eq("project_id", projectId)
        .eq("task_id", taskId);
    } catch (error) {
      console.error("Failed to auto-save criteria:", error);
    }
  }, [projectId, user?.id, salesCopyCount]);

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

  const hasSalesCopy = salesCopyCount > 0 || initialSalesCopyCount > 0;

  const handleSaveAndComplete = async () => {
    if (!hasSalesCopy) {
      toast.error("Please write copy for at least one offer before completing this task");
      return;
    }

    setIsSaving(true);

    try {
      await completeTask(taskId, { 
        salesCopyCount: salesCopyCount || initialSalesCopyCount,
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

  const phaseLabel = PHASE_LABELS[taskTemplate.phase] || taskTemplate.phase;
  const timeRange = `${taskTemplate.estimatedMinutesMin}–${taskTemplate.estimatedMinutesMax} minutes`;
  const voiceScript = generateVoiceScript(taskId, taskTemplate.whyItMatters);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Why this matters
            </h2>
            {voiceScript && (
              <VoiceSnippetButton taskId={taskId} script={voiceScript} />
            )}
          </div>
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

        {/* Your Response - SalesPageCopyTab embedded */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Your response
          </h2>
          
          {projectId && (
            <SalesPageCopyTab projectId={projectId} />
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
            disabled={!hasSalesCopy || isSaving}
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
