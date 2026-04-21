import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Loader2, Check, Zap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { toast } from "sonner";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { PHASE_LABELS } from "@/types/tasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SalesPageCopyTab } from "@/components/content/sales-copy";
import { VoiceSnippetButton } from "@/components/ui/voice-snippet-button";
import { generateVoiceScript } from "@/lib/generateVoiceScript";
import { EditorialTaskShell } from "@/components/task/EditorialTaskShell";

export default function SalesCopyTask() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const taskId = 'messaging_sales_copy';
  const { tier, hasAdminAccess } = useFeatureAccess();
  const isAdvanced = tier === 'advanced' || hasAdminAccess;
  
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

  const timeRange = `${taskTemplate.estimatedMinutesMin}–${taskTemplate.estimatedMinutesMax} minutes`;
  const voiceScript = generateVoiceScript(taskId, taskTemplate.whyItMatters);

  return (
    <EditorialTaskShell
      projectId={projectId!}
      taskId="messaging_sales_copy"
      phase={taskTemplate.phase}
      title={taskTemplate.title}
      whyItMatters={taskTemplate.whyItMatters}
      instructions={taskTemplate.instructions}
      estimatedTimeRange={timeRange}
      voiceButton={voiceScript ? <VoiceSnippetButton taskId={taskId} script={voiceScript} /> : undefined}
      footer={
        <div className="flex flex-col sm:flex-row gap-3">
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
          <Button variant="outline" onClick={handleSaveForLater} className="sm:w-auto">
            Save for Later
          </Button>
        </div>
      }
    >
      {isAdvanced ? (
        <div className="flex items-center justify-between gap-4 mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-ink-800 leading-relaxed">
              Pro tip: Use the AI-powered Sales Page Writer to generate a full draft in seconds, then refine it section by section below.
            </p>
          </div>
          <button
            onClick={() => navigate('/app/ai-studio/sales-page')}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline shrink-0 whitespace-nowrap"
          >
            Open AI Writer <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-ink-800 leading-relaxed">
              Want AI to write your full sales page draft in seconds?
            </p>
          </div>
          <button
            onClick={() => navigate('/#pricing')}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline shrink-0 whitespace-nowrap"
          >
            Upgrade to Advanced <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {projectId && <SalesPageCopyTab projectId={projectId} />}

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
