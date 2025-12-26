import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  const [isSaving, setIsSaving] = useState(false);

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

  // Fetch project context (read-only display)
  const { data: projectContext, isLoading: contextLoading } = useQuery({
    queryKey: ["project-context-bio", projectId],
    queryFn: async () => {
      // Fetch project data
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("transformation_statement, selected_funnel_type")
        .eq("id", projectId)
        .maybeSingle();
      
      if (projectError) throw projectError;

      // Fetch planning task data
      const { data: tasks, error: tasksError } = await supabase
        .from("project_tasks")
        .select("task_id, input_data")
        .eq("project_id", projectId)
        .in("task_id", ["planning_define_audience", "planning_define_problem", "planning_define_dream_outcome"]);
      
      if (tasksError) throw tasksError;

      const audienceTask = tasks?.find(t => t.task_id === "planning_define_audience");
      const problemTask = tasks?.find(t => t.task_id === "planning_define_problem");
      const outcomeTask = tasks?.find(t => t.task_id === "planning_define_dream_outcome");

      return {
        targetAudience: (audienceTask?.input_data as any)?.audience_description || null,
        coreProblem: (problemTask?.input_data as any)?.primary_problem || null,
        dreamOutcome: (outcomeTask?.input_data as any)?.dream_outcome || null,
        funnelType: project?.selected_funnel_type || null,
      };
    },
    enabled: !!projectId,
  });

  // Fetch existing bios to determine completion status
  const { data: existingBios = [] } = useQuery({
    queryKey: ["social-bios", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_bios")
        .select("id")
        .eq("project_id", projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const hasBios = existingBios.length > 0;

  const handleCriteriaToggle = (criteriaText: string) => {
    setCompletedCriteria((prev) =>
      prev.includes(criteriaText)
        ? prev.filter((c) => c !== criteriaText)
        : [...prev, criteriaText]
    );
  };

  const allCriteriaComplete = taskTemplate?.completionCriteria?.every(c => 
    completedCriteria.includes(c)
  ) ?? false;

  const handleSaveAndComplete = async () => {
    if (!hasBios) {
      toast.error("Please create at least one bio before completing this task");
      return;
    }

    if (!allCriteriaComplete) {
      toast.error("Please confirm the completion criteria before continuing");
      return;
    }

    setIsSaving(true);

    try {
      await completeTask(taskId, { 
        biosCreated: existingBios.length,
        completedCriteria 
      });
      
      toast.success("Great work! Task saved and marked complete.");
      navigate(`/projects/${projectId}/offer`);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task. Please try again.");
    } finally {
      setIsSaving(false);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <Link
            to={`/projects/${projectId}/offer`}
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

        {/* Project Context (Read-only) */}
        {!contextLoading && projectContext && (
          <section className="mb-10">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Your project context
            </h2>
            <Card className="bg-muted/30 border-muted">
              <CardContent className="p-4 space-y-3">
                {projectContext.targetAudience && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Target Audience</span>
                    <p className="text-sm text-foreground/80 mt-1">{projectContext.targetAudience}</p>
                  </div>
                )}
                {projectContext.coreProblem && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Core Problem</span>
                    <p className="text-sm text-foreground/80 mt-1">{projectContext.coreProblem}</p>
                  </div>
                )}
                {projectContext.dreamOutcome && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Dream Outcome</span>
                    <p className="text-sm text-foreground/80 mt-1">{projectContext.dreamOutcome}</p>
                  </div>
                )}
                {projectContext.funnelType && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Funnel Type</span>
                    <p className="text-sm text-foreground/80 mt-1 capitalize">{projectContext.funnelType.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {!projectContext.targetAudience && !projectContext.coreProblem && !projectContext.dreamOutcome && (
                  <p className="text-sm text-muted-foreground italic">
                    Complete the planning tasks to see your project context here.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        <div className="h-px bg-border mb-10" />

        {/* Your Response - SocialBioBuilder embedded */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Your response
          </h2>
          
          {projectId && <SocialBioBuilder projectId={projectId} />}
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
            disabled={!hasBios || !allCriteriaComplete || isSaving}
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
            onClick={() => navigate(`/projects/${projectId}/offer`)}
            className="sm:w-auto"
          >
            Save for Later
          </Button>
        </div>
      </div>
    </div>
  );
}