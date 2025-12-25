import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectSummaryData {
  // Project info
  projectName: string;
  transformationStatement: string | null;
  launchDate: string | null;
  
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
    priceType: string | null;
    price: number | null;
  }>;
  
  // Content themes (unique labels from content planner)
  contentThemes: string[];
  
  // Messaging highlights
  hasEmailSequences: boolean;
  hasSalesCopy: boolean;
  hasDeliverableCopy: boolean;
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
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("name, transformation_statement")
          .eq("id", projectId)
          .single(),
        supabase
          .from("funnels")
          .select("niche, target_audience, primary_pain_point, pain_symptoms, desired_outcome, funnel_type")
          .eq("project_id", projectId)
          .maybeSingle(),
        supabase
          .from("offers")
          .select("title, offer_type, price_type, price")
          .eq("project_id", projectId)
          .order("slot_position"),
        supabase
          .from("content_planner")
          .select("labels")
          .eq("project_id", projectId),
        supabase
          .from("launch_events")
          .select("enrollment_opens, prelaunch_start")
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
      ]);

      if (projectResult.error) throw projectResult.error;

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

      // Get launch date
      const launchEvent = launchEventResult.data?.[0];
      const launchDate = launchEvent?.enrollment_opens || launchEvent?.prelaunch_start || null;

      return {
        projectName: projectResult.data.name,
        transformationStatement: projectResult.data.transformation_statement,
        launchDate,
        niche: funnelResult.data?.niche || null,
        targetAudience: funnelResult.data?.target_audience || null,
        primaryPainPoint: funnelResult.data?.primary_pain_point || null,
        painSymptoms,
        desiredOutcome: funnelResult.data?.desired_outcome || null,
        funnelType: funnelResult.data?.funnel_type || null,
        offers: (offersResult.data || []).map((o) => ({
          title: o.title,
          offerType: o.offer_type,
          priceType: o.price_type,
          price: o.price,
        })),
        contentThemes: uniqueThemes,
        hasEmailSequences: (emailsResult.data?.length || 0) > 0,
        hasSalesCopy: (salesCopyResult.data?.length || 0) > 0,
        hasDeliverableCopy: (deliverablesResult.data?.length || 0) > 0,
      };
    },
    enabled: !!projectId,
  });
}
