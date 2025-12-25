import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Pattern insight type - observational, non-judgmental
 */
export interface PatternInsight {
  id: string;
  text: string;
  category: 'messaging' | 'launch_path' | 'content' | 'offer' | 'general';
}

/**
 * Playbook data structure - all derived from COMPLETED projects only
 */
export interface PlaybookData {
  // Meta
  completedProjectCount: number;
  hasEnoughData: boolean;
  
  // Pattern insights (3-5 auto-generated)
  insights: PatternInsight[];
  
  // Messaging patterns
  messagingPatterns: {
    toneDescription: string | null;
    commonPhrases: string[];
  };
  
  // Launch paths used
  launchPaths: {
    funnelType: string;
    label: string;
    count: number;
  }[];
  
  // Content themes
  contentThemes: string[];
  
  // What usually stays consistent (foundational memory)
  consistentElements: {
    audienceClarity: boolean;
    coreProblem: boolean;
    dreamOutcome: boolean;
    offerFormat: boolean;
  };
}

// Funnel type labels for human-readable display
const FUNNEL_LABELS: Record<string, string> = {
  'webinar-funnel': 'Live Training → Offer',
  'challenge-funnel': 'Challenge → Offer',
  'video-series-funnel': 'Video Series → Offer',
  'direct-sales-funnel': 'Content → Offer',
  'lead-magnet-funnel': 'Freebie → Email → Offer',
  'application-funnel': 'Application → Call',
};

// Generate soft, observational insights based on patterns
function generateInsights(data: {
  funnelTypes: string[];
  hasConsistentAudience: boolean;
  hasConsistentProblem: boolean;
  hasConsistentOutcome: boolean;
  hasConsistentOffer: boolean;
  contentThemes: string[];
}): PatternInsight[] {
  const insights: PatternInsight[] = [];
  
  // Funnel path patterns
  if (data.funnelTypes.length > 0) {
    const mostCommon = data.funnelTypes[0];
    if (mostCommon === 'webinar-funnel') {
      insights.push({
        id: 'funnel-webinar',
        text: 'You tend to prefer live training as your main launch event.',
        category: 'launch_path',
      });
    } else if (mostCommon === 'challenge-funnel') {
      insights.push({
        id: 'funnel-challenge',
        text: 'You usually choose multi-day experiences to build connection before offering.',
        category: 'launch_path',
      });
    } else if (mostCommon === 'direct-sales-funnel') {
      insights.push({
        id: 'funnel-direct',
        text: 'You often keep your launch path simple and direct.',
        category: 'launch_path',
      });
    } else if (mostCommon === 'lead-magnet-funnel') {
      insights.push({
        id: 'funnel-nurture',
        text: 'You tend to prefer nurturing your audience before inviting them in.',
        category: 'launch_path',
      });
    }
  }
  
  // Consistency patterns
  if (data.hasConsistentAudience && data.hasConsistentProblem) {
    insights.push({
      id: 'consistent-foundation',
      text: 'You usually keep your audience and problem definition consistent across launches.',
      category: 'general',
    });
  }
  
  if (data.hasConsistentOffer) {
    insights.push({
      id: 'offer-focus',
      text: 'You tend to keep your offers focused and contained.',
      category: 'offer',
    });
  }
  
  // Content theme patterns
  if (data.contentThemes.length >= 3) {
    insights.push({
      id: 'content-themes',
      text: 'You often return to a consistent set of content themes.',
      category: 'content',
    });
  }
  
  // General messaging insight
  insights.push({
    id: 'messaging-clarity',
    text: 'You tend to explain things clearly before inviting people in.',
    category: 'messaging',
  });
  
  return insights.slice(0, 5); // Max 5 insights
}

export function usePlaybookData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['playbook-data', user?.id],
    queryFn: async (): Promise<PlaybookData> => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Fetch ONLY completed projects
      const { data: completedProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, transformation_statement, selected_funnel_type')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      if (projectsError) throw projectsError;
      
      const completedProjectCount = completedProjects?.length || 0;
      
      // Need at least 1 completed project to show playbook
      if (completedProjectCount < 1) {
        return {
          completedProjectCount,
          hasEnoughData: false,
          insights: [],
          messagingPatterns: { toneDescription: null, commonPhrases: [] },
          launchPaths: [],
          contentThemes: [],
          consistentElements: {
            audienceClarity: false,
            coreProblem: false,
            dreamOutcome: false,
            offerFormat: false,
          },
        };
      }
      
      const projectIds = completedProjects.map(p => p.id);
      
      // Fetch funnels for completed projects
      const { data: funnels } = await supabase
        .from('funnels')
        .select('funnel_type, target_audience, primary_pain_point, desired_outcome')
        .in('project_id', projectIds);
      
      // Fetch offers for completed projects
      const { data: offers } = await supabase
        .from('offers')
        .select('offer_type, offer_category')
        .in('project_id', projectIds);
      
      // Fetch content themes for completed projects
      const { data: contentItems } = await supabase
        .from('content_planner')
        .select('labels')
        .in('project_id', projectIds);
      
      // Analyze funnel types
      const funnelTypeCounts: Record<string, number> = {};
      funnels?.forEach(f => {
        if (f.funnel_type) {
          funnelTypeCounts[f.funnel_type] = (funnelTypeCounts[f.funnel_type] || 0) + 1;
        }
      });
      
      const sortedFunnelTypes = Object.entries(funnelTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({
          funnelType: type,
          label: FUNNEL_LABELS[type] || type,
          count,
        }));
      
      // Extract content themes
      const allLabels = contentItems?.flatMap(c => c.labels || []) || [];
      const themeCounts: Record<string, number> = {};
      allLabels.forEach(label => {
        themeCounts[label] = (themeCounts[label] || 0) + 1;
      });
      const topThemes = Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([theme]) => theme);
      
      // Check consistency patterns
      const hasConsistentAudience = funnels?.every(f => f.target_audience) || false;
      const hasConsistentProblem = funnels?.every(f => f.primary_pain_point) || false;
      const hasConsistentOutcome = funnels?.every(f => f.desired_outcome) || false;
      const hasConsistentOffer = (offers?.length || 0) > 0;
      
      // Generate insights
      const insights = generateInsights({
        funnelTypes: sortedFunnelTypes.map(f => f.funnelType),
        hasConsistentAudience,
        hasConsistentProblem,
        hasConsistentOutcome,
        hasConsistentOffer,
        contentThemes: topThemes,
      });
      
      // Determine messaging tone (simplified - would be AI-enhanced in production)
      let toneDescription: string | null = null;
      if (completedProjectCount >= 1) {
        toneDescription = 'clear and reassuring';
      }
      
      return {
        completedProjectCount,
        hasEnoughData: true,
        insights,
        messagingPatterns: {
          toneDescription,
          commonPhrases: [],
        },
        launchPaths: sortedFunnelTypes,
        contentThemes: topThemes,
        consistentElements: {
          audienceClarity: hasConsistentAudience,
          coreProblem: hasConsistentProblem,
          dreamOutcome: hasConsistentOutcome,
          offerFormat: hasConsistentOffer,
        },
      };
    },
    enabled: !!user?.id,
  });
}
