import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AnnualReviewData {
  // Basic info
  completedProjects: Array<{
    id: string;
    name: string;
    completedAt: string;
  }>;
  totalCompleted: number;
  isEligible: boolean; // ≥2 completed projects
  
  // Patterns observed (language-based, no metrics)
  patterns: {
    // Audiences you've served
    audiences: string[];
    // Niches you've explored
    niches: string[];
    // Funnel approaches used
    funnelTypes: string[];
    // Recurring themes in messaging
    messagingThemes: string[];
  };
  
  // What stayed consistent
  consistentElements: {
    // Elements that appeared in multiple projects
    recurringAudiences: string[];
    recurringNiches: string[];
    preferredFunnelType: string | null;
  };
}

/**
 * Hook to fetch and analyze data for the Annual Review feature.
 * Only fetches completed projects and identifies patterns across them.
 */
export function useAnnualReview() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["annual-review", user?.id],
    queryFn: async (): Promise<AnnualReviewData> => {
      if (!user) throw new Error("Not authenticated");

      // Fetch completed projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, updated_at, transformation_statement")
        .eq("status", "completed")
        .order("updated_at", { ascending: false });

      if (projectsError) throw projectsError;

      const completedProjects = (projects || []).map((p) => ({
        id: p.id,
        name: p.name,
        completedAt: p.updated_at,
      }));

      const totalCompleted = completedProjects.length;
      const isEligible = totalCompleted >= 2;

      // If not eligible, return minimal data
      if (!isEligible) {
        return {
          completedProjects,
          totalCompleted,
          isEligible,
          patterns: {
            audiences: [],
            niches: [],
            funnelTypes: [],
            messagingThemes: [],
          },
          consistentElements: {
            recurringAudiences: [],
            recurringNiches: [],
            preferredFunnelType: null,
          },
        };
      }

      // Fetch funnel data for all completed projects
      const projectIds = completedProjects.map((p) => p.id);
      const { data: funnels, error: funnelsError } = await supabase
        .from("funnels")
        .select("project_id, target_audience, niche, funnel_type, desired_outcome")
        .in("project_id", projectIds);

      if (funnelsError) throw funnelsError;

      // Extract and count patterns
      const audiences: string[] = [];
      const niches: string[] = [];
      const funnelTypes: string[] = [];
      const messagingThemes: string[] = [];

      const audienceCounts: Record<string, number> = {};
      const nicheCounts: Record<string, number> = {};
      const funnelTypeCounts: Record<string, number> = {};

      for (const funnel of funnels || []) {
        if (funnel.target_audience) {
          audiences.push(funnel.target_audience);
          audienceCounts[funnel.target_audience] = (audienceCounts[funnel.target_audience] || 0) + 1;
        }
        if (funnel.niche) {
          niches.push(funnel.niche);
          nicheCounts[funnel.niche] = (nicheCounts[funnel.niche] || 0) + 1;
        }
        if (funnel.funnel_type) {
          funnelTypes.push(funnel.funnel_type);
          funnelTypeCounts[funnel.funnel_type] = (funnelTypeCounts[funnel.funnel_type] || 0) + 1;
        }
        if (funnel.desired_outcome) {
          messagingThemes.push(funnel.desired_outcome);
        }
      }

      // Also include transformation statements as messaging themes
      for (const project of projects || []) {
        if (project.transformation_statement) {
          messagingThemes.push(project.transformation_statement);
        }
      }

      // Find recurring elements (appeared more than once)
      const recurringAudiences = Object.entries(audienceCounts)
        .filter(([, count]) => count > 1)
        .map(([audience]) => audience);

      const recurringNiches = Object.entries(nicheCounts)
        .filter(([, count]) => count > 1)
        .map(([niche]) => niche);

      // Find most common funnel type
      let preferredFunnelType: string | null = null;
      let maxFunnelCount = 0;
      for (const [type, count] of Object.entries(funnelTypeCounts)) {
        if (count > maxFunnelCount && count > 1) {
          maxFunnelCount = count;
          preferredFunnelType = type;
        }
      }

      return {
        completedProjects,
        totalCompleted,
        isEligible,
        patterns: {
          audiences: [...new Set(audiences)],
          niches: [...new Set(niches)],
          funnelTypes: [...new Set(funnelTypes)],
          messagingThemes: [...new Set(messagingThemes)].slice(0, 5), // Limit themes
        },
        consistentElements: {
          recurringAudiences,
          recurringNiches,
          preferredFunnelType,
        },
      };
    },
    enabled: !!user,
  });
}
