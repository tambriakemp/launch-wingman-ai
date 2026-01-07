import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PhaseStatuses {
  planning?: string;
  messaging?: string;
  build?: string;
  content?: string;
  launch?: string;
  "post-launch"?: string;
}

export const usePhaseCompletion = (projectId: string | undefined) => {
  const { data: project, isLoading } = useQuery({
    queryKey: ["project-phases", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from("projects")
        .select("phase_statuses, active_phase")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const phaseStatuses = (project?.phase_statuses as PhaseStatuses) || {};

  // A phase is "complete" if its status is 'complete' or if a later phase is active/complete
  const phaseOrder = ["planning", "messaging", "build", "content", "launch", "post-launch"];
  
  const getPhaseIndex = (phase: string) => phaseOrder.indexOf(phase);
  const activePhaseIndex = getPhaseIndex(project?.active_phase || "planning");

  const isPlanningComplete = 
    phaseStatuses.planning === "complete" || 
    activePhaseIndex > getPhaseIndex("planning");

  const isMessagingComplete = 
    phaseStatuses.messaging === "complete" || 
    activePhaseIndex > getPhaseIndex("messaging");

  const isBuildComplete = 
    phaseStatuses.build === "complete" || 
    activePhaseIndex > getPhaseIndex("build");

  const isContentComplete = 
    phaseStatuses.content === "complete" || 
    activePhaseIndex > getPhaseIndex("content");

  // For launch timeline, require both planning and messaging to be complete
  const canAccessLaunchTimeline = isPlanningComplete && isMessagingComplete;

  return {
    isLoading,
    phaseStatuses,
    activePhase: project?.active_phase,
    isPlanningComplete,
    isMessagingComplete,
    isBuildComplete,
    isContentComplete,
    canAccessLaunchTimeline,
  };
};
