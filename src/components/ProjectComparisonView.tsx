import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Target, MessageSquare, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Funnel type labels (same as in ProjectSummary)
const FUNNEL_TYPE_LABELS: Record<string, string> = {
  "webinar-funnel": "Live Training → Offer",
  "challenge-funnel": "Challenge → Offer",
  "video-series-funnel": "Video Series → Offer",
  "direct-sales-funnel": "Content → Offer",
  "lead-magnet-funnel": "Freebie → Email → Offer",
  "application-funnel": "Application → Call",
};

interface ComparisonData {
  projectName: string;
  targetAudience: string | null;
  desiredOutcome: string | null;
  coreMessage: string | null;
  funnelType: string | null;
}

interface ProjectComparisonViewProps {
  currentProjectId: string;
  comparisonProjectId: string;
  onClose: () => void;
}

function useComparisonData(projectId: string) {
  return useQuery({
    queryKey: ["project-comparison-data", projectId],
    queryFn: async (): Promise<ComparisonData> => {
      // Fetch project and funnel data
      const [projectResult, funnelResult, messagingResult] = await Promise.all([
        supabase
          .from("projects")
          .select("name, transformation_statement")
          .eq("id", projectId)
          .single(),
        supabase
          .from("funnels")
          .select("target_audience, desired_outcome, funnel_type")
          .eq("project_id", projectId)
          .maybeSingle(),
        supabase
          .from("project_tasks")
          .select("input_data")
          .eq("project_id", projectId)
          .eq("task_id", "messaging_core_message")
          .maybeSingle(),
      ]);

      if (projectResult.error) throw projectResult.error;

      // Extract core message from messaging task
      let coreMessage: string | null = null;
      if (messagingResult.data?.input_data) {
        const inputData = messagingResult.data.input_data as Record<string, unknown>;
        if (inputData.core_message) {
          coreMessage = inputData.core_message as string;
        }
      }

      // Fall back to transformation statement if no core message
      if (!coreMessage && projectResult.data.transformation_statement) {
        coreMessage = projectResult.data.transformation_statement;
      }

      return {
        projectName: projectResult.data.name,
        targetAudience: funnelResult.data?.target_audience || null,
        desiredOutcome: funnelResult.data?.desired_outcome || null,
        coreMessage,
        funnelType: funnelResult.data?.funnel_type || null,
      };
    },
    enabled: !!projectId,
  });
}

function ComparisonField({
  label,
  icon: Icon,
  currentValue,
  comparisonValue,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  currentValue: string | null;
  comparisonValue: string | null;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="w-4 h-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Current</p>
            <p className="text-sm text-foreground leading-relaxed">
              {currentValue || <span className="italic text-muted-foreground/60">Not defined</span>}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Previous</p>
            <p className="text-sm text-foreground leading-relaxed">
              {comparisonValue || <span className="italic text-muted-foreground/60">Not defined</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ProjectComparisonView({
  currentProjectId,
  comparisonProjectId,
  onClose,
}: ProjectComparisonViewProps) {
  const { data: currentData, isLoading: currentLoading } = useComparisonData(currentProjectId);
  const { data: comparisonData, isLoading: comparisonLoading } = useComparisonData(comparisonProjectId);

  const isLoading = currentLoading || comparisonLoading;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!currentData || !comparisonData) {
    return (
      <div className="max-w-3xl mx-auto py-8 text-center text-muted-foreground">
        Unable to load comparison data.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Summary
        </Button>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Comparing Projects
          </h2>
          <p className="text-sm text-muted-foreground">
            This is simply a snapshot of how your thinking looked at different moments.
          </p>
        </div>

        {/* Project names header */}
        <div className="grid grid-cols-2 gap-4 pb-2">
          <div className="text-sm font-medium text-foreground">
            {currentData.projectName}
          </div>
          <div className="text-sm font-medium text-foreground">
            {comparisonData.projectName}
          </div>
        </div>
      </div>

      {/* Comparison Fields */}
      <div className="space-y-4">
        <ComparisonField
          label="Target Audience"
          icon={Users}
          currentValue={currentData.targetAudience}
          comparisonValue={comparisonData.targetAudience}
        />

        <ComparisonField
          label="Dream Outcome"
          icon={Target}
          currentValue={currentData.desiredOutcome}
          comparisonValue={comparisonData.desiredOutcome}
        />

        <ComparisonField
          label="Core Message"
          icon={MessageSquare}
          currentValue={currentData.coreMessage}
          comparisonValue={comparisonData.coreMessage}
        />

        <ComparisonField
          label="Funnel Type"
          icon={GitBranch}
          currentValue={currentData.funnelType ? FUNNEL_TYPE_LABELS[currentData.funnelType] || currentData.funnelType : null}
          comparisonValue={comparisonData.funnelType ? FUNNEL_TYPE_LABELS[comparisonData.funnelType] || comparisonData.funnelType : null}
        />
      </div>

      {/* Footer note */}
      <p className="text-xs text-center text-muted-foreground/70 pt-4">
        Reflection helps you notice patterns without judgment.
      </p>
    </motion.div>
  );
}
