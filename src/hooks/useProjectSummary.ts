import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectState } from "@/types/projectLifecycle";

export interface ProjectSummaryData {
  // Project info
  projectName: string;
  projectStatus: ProjectState;
  transformationStatement: string | null;
  
  // Relaunch info
  isRelaunch: boolean;
  parentProjectId: string | null;
  parentProjectName: string | null;
  
  // Audience & Problem
  niche: string | null;
  targetAudience: string | null;
  primaryPainPoint: string | null;
  painSymptoms: string[];
  
  // Dream Outcome
  desiredOutcome: string | null;
  
  // Funnel
  funnelType: string | null;
  
  // Offers
  offers: Array<{
    title: string | null;
    offerType: string;
    offerCategory: string | null;
    priceType: string | null;
    price: number | null;
    description: string | null;
  }>;
  
  // Messaging highlights
  coreMessage: string | null;
  talkingPoints: string[];
  hasEmailSequences: boolean;
  hasSalesCopy: boolean;
  hasDeliverableCopy: boolean;
  
  // Content themes (unique labels from content planner)
  contentThemes: string[];
  
  // Launch window
  launchWindow: {
    enrollmentOpens: string | null;
    enrollmentCloses: string | null;
    prelaunchStart: string | null;
    durationDays: number | null;
  } | null;
}

export function useProjectSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-summary", projectId],
    queryFn: async (): Promise<ProjectSummaryData> => {
      if (!projectId) throw new Error("No project ID");

      // Fetch all data in parallel
      const [
        projectResult,
        funnelResult,
        offersResult,
        contentResult,
        launchEventResult,
        emailsResult,
        salesCopyResult,
        deliverablesResult,
        messagingTasksResult,
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("name, transformation_statement, status, is_relaunch, parent_project_id")
          .eq("id", projectId)
          .single(),
        supabase
          .from("funnels")
          .select("niche, target_audience, primary_pain_point, pain_symptoms, desired_outcome, funnel_type")
          .eq("project_id", projectId)
          .maybeSingle(),
        supabase
          .from("offers")
          .select("title, offer_type, offer_category, price_type, price, description")
          .eq("project_id", projectId)
          .order("slot_position"),
        supabase
          .from("content_planner")
          .select("labels")
          .eq("project_id", projectId),
        supabase
          .from("launch_events")
          .select("enrollment_opens, enrollment_closes, prelaunch_start")
          .eq("project_id", projectId)
          .order("prelaunch_start", { ascending: true })
          .limit(1),
        supabase
          .from("email_sequences")
          .select("id")
          .eq("project_id", projectId)
          .limit(1),
        supabase
          .from("sales_page_copy")
          .select("id")
          .eq("project_id", projectId)
          .limit(1),
        supabase
          .from("deliverable_copy")
          .select("id")
          .eq("project_id", projectId)
          .limit(1),
        // Fetch messaging tasks for core message and talking points
        supabase
          .from("project_tasks")
          .select("task_id, input_data")
          .eq("project_id", projectId)
          .in("task_id", ["messaging_core_message", "messaging_talking_points"]),
      ]);

      if (projectResult.error) throw projectResult.error;

      // Fetch parent project name if this is a relaunch
      let parentProjectName: string | null = null;
      if (projectResult.data.is_relaunch && projectResult.data.parent_project_id) {
        const { data: parentProject } = await supabase
          .from("projects")
          .select("name")
          .eq("id", projectResult.data.parent_project_id)
          .maybeSingle();
        parentProjectName = parentProject?.name || null;
      }

      // Extract unique content themes from labels
      const allLabels = contentResult.data?.flatMap((c) => c.labels || []) || [];
      const uniqueThemes = [...new Set(allLabels)].slice(0, 6); // Limit to 6 themes

      // Parse pain symptoms
      const painSymptoms = Array.isArray(funnelResult.data?.pain_symptoms)
        ? (funnelResult.data.pain_symptoms as Array<{ symptom?: string }>)
            .map((s) => s.symptom || "")
            .filter(Boolean)
            .slice(0, 3)
        : [];

      // Parse messaging data
      let coreMessage: string | null = null;
      let talkingPoints: string[] = [];

      if (messagingTasksResult.data) {
        for (const task of messagingTasksResult.data) {
          const inputData = task.input_data as Record<string, unknown> | null;
          if (task.task_id === "messaging_core_message" && inputData?.core_message) {
            coreMessage = inputData.core_message as string;
          }
          if (task.task_id === "messaging_talking_points" && inputData?.talking_points) {
            // talking_points might be stored as array or comma-separated string
            const tp = inputData.talking_points;
            if (Array.isArray(tp)) {
              talkingPoints = tp.filter((t): t is string => typeof t === "string" && t.trim() !== "");
            } else if (typeof tp === "string") {
              talkingPoints = tp.split(/[,\n]/).map(t => t.trim()).filter(Boolean);
            }
          }
        }
      }

      // Calculate launch window
      let launchWindow: ProjectSummaryData["launchWindow"] = null;
      const launchEvent = launchEventResult.data?.[0];
      if (launchEvent) {
        const enrollmentOpens = launchEvent.enrollment_opens;
        const enrollmentCloses = launchEvent.enrollment_closes;
        const prelaunchStart = launchEvent.prelaunch_start;
        
        let durationDays: number | null = null;
        if (enrollmentOpens && enrollmentCloses) {
          const start = new Date(enrollmentOpens);
          const end = new Date(enrollmentCloses);
          durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }

        launchWindow = {
          enrollmentOpens,
          enrollmentCloses,
          prelaunchStart,
          durationDays,
        };
      }

      return {
        projectName: projectResult.data.name,
        projectStatus: (projectResult.data.status || "draft") as ProjectState,
        transformationStatement: projectResult.data.transformation_statement,
        isRelaunch: projectResult.data.is_relaunch || false,
        parentProjectId: projectResult.data.parent_project_id || null,
        parentProjectName,
        niche: funnelResult.data?.niche || null,
        targetAudience: funnelResult.data?.target_audience || null,
        primaryPainPoint: funnelResult.data?.primary_pain_point || null,
        painSymptoms,
        desiredOutcome: funnelResult.data?.desired_outcome || null,
        funnelType: funnelResult.data?.funnel_type || null,
        offers: (offersResult.data || []).map((o) => ({
          title: o.title,
          offerType: o.offer_type,
          offerCategory: o.offer_category,
          priceType: o.price_type,
          price: o.price,
          description: o.description,
        })),
        coreMessage,
        talkingPoints,
        contentThemes: uniqueThemes,
        hasEmailSequences: (emailsResult.data?.length || 0) > 0,
        hasSalesCopy: (salesCopyResult.data?.length || 0) > 0,
        hasDeliverableCopy: (deliverablesResult.data?.length || 0) > 0,
        launchWindow,
      };
    },
    enabled: !!projectId,
  });
}
