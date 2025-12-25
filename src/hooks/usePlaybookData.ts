import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { type CheckInPatterns } from "./useCheckInPatterns";

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

/**
 * Applies check-in pattern influence to insight text.
 * 
 * CRITICAL: This ONLY adjusts phrasing/tone, never content or meaning.
 * These adjustments are invisible to users - the Playbook just "feels" right.
 */
function applyPatternInfluence(
  baseText: string, 
  patterns: CheckInPatterns | null,
  category: PatternInsight['category']
): string {
  if (!patterns || patterns.checkInCount < 2) {
    return baseText;
  }
  
  let adjustedText = baseText;
  
  // Tone sensitivity adjustments (softer language for those expressing weight)
  if (patterns.toneBias === 'soft') {
    // Shift to gentler, more spacious language
    adjustedText = adjustedText
      .replace('You tend to move forward', 'You tend to move forward once things feel lighter')
      .replace('You usually keep', 'You tend to feel most comfortable when you keep')
      .replace('You often keep', 'You tend to value keeping');
  } else if (patterns.toneBias === 'grounded') {
    // Slightly more direct, confident language
    adjustedText = adjustedText
      .replace('You tend to', 'You naturally')
      .replace('You usually', 'You consistently');
  }
  
  // Confidence framing adjustments
  if (patterns.confidenceLevel === 'tentative') {
    adjustedText = adjustedText
      .replace('You usually keep your offers focused', 'You tend to value clarity before committing to direction')
      .replace('consistent across launches', 'thoughtfully maintained as you find your path');
  }
  
  // Stability vs exploration adjustments
  if (patterns.orientationBias === 'stability' && patterns.checkInCount >= 3) {
    adjustedText = adjustedText
      .replace('You often return to', 'You often build on what already feels aligned');
  } else if (patterns.orientationBias === 'exploration' && patterns.checkInCount >= 3) {
    adjustedText = adjustedText
      .replace('You often return to', 'You tend to explore ideas before settling into a direction');
  }
  
  // Relaunch affinity adjustments
  if (patterns.relaunchAffinity && category === 'general') {
    adjustedText = adjustedText
      .replace('consistent across launches', 'built upon rather than started over');
  }
  
  return adjustedText;
}

// Generate soft, observational insights based on patterns
function generateInsights(
  data: {
    funnelTypes: string[];
    hasConsistentAudience: boolean;
    hasConsistentProblem: boolean;
    hasConsistentOutcome: boolean;
    hasConsistentOffer: boolean;
    contentThemes: string[];
  },
  checkInPatterns: CheckInPatterns | null
): PatternInsight[] {
  const insights: PatternInsight[] = [];
  
  // Funnel path patterns
  if (data.funnelTypes.length > 0) {
    const mostCommon = data.funnelTypes[0];
    let text = '';
    
    if (mostCommon === 'webinar-funnel') {
      text = 'You tend to prefer live training as your main launch event.';
    } else if (mostCommon === 'challenge-funnel') {
      text = 'You usually choose multi-day experiences to build connection before offering.';
    } else if (mostCommon === 'direct-sales-funnel') {
      text = 'You often keep your launch path simple and direct.';
    } else if (mostCommon === 'lead-magnet-funnel') {
      text = 'You tend to prefer nurturing your audience before inviting them in.';
    }
    
    if (text) {
      insights.push({
        id: 'funnel-' + mostCommon.replace('-funnel', ''),
        text: applyPatternInfluence(text, checkInPatterns, 'launch_path'),
        category: 'launch_path',
      });
    }
  }
  
  // Consistency patterns
  if (data.hasConsistentAudience && data.hasConsistentProblem) {
    const baseText = 'You usually keep your audience and problem definition consistent across launches.';
    insights.push({
      id: 'consistent-foundation',
      text: applyPatternInfluence(baseText, checkInPatterns, 'general'),
      category: 'general',
    });
  }
  
  if (data.hasConsistentOffer) {
    const baseText = 'You tend to keep your offers focused and contained.';
    insights.push({
      id: 'offer-focus',
      text: applyPatternInfluence(baseText, checkInPatterns, 'offer'),
      category: 'offer',
    });
  }
  
  // Content theme patterns
  if (data.contentThemes.length >= 3) {
    const baseText = 'You often return to a consistent set of content themes.';
    insights.push({
      id: 'content-themes',
      text: applyPatternInfluence(baseText, checkInPatterns, 'content'),
      category: 'content',
    });
  }
  
  // General messaging insight
  const messagingBase = 'You tend to explain things clearly before inviting people in.';
  insights.push({
    id: 'messaging-clarity',
    text: applyPatternInfluence(messagingBase, checkInPatterns, 'messaging'),
    category: 'messaging',
  });
  
  return insights.slice(0, 5); // Max 5 insights
}

/**
 * Fetches check-in patterns directly (for use within playbook query)
 */
async function fetchCheckInPatterns(userId: string): Promise<CheckInPatterns | null> {
  const { data: checkIns, error } = await supabase
    .from('check_ins')
    .select('reflection_response, orientation_choice, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error || !checkIns) return null;
  
  const checkInCount = checkIns.length;
  
  if (checkInCount === 0) {
    return {
      toneBias: 'neutral',
      confidenceLevel: 'balanced',
      orientationBias: 'neutral',
      relaunchAffinity: false,
      checkInCount: 0,
    };
  }
  
  // Tone sensitivity analysis
  const SOFT_TONE_INDICATORS = [
    'overwhelmed', 'heavy', 'unclear', 'confused', 'stuck',
    'uncertain', 'anxious', 'tired', 'exhausted', 'lost',
    'frustrated', 'worried', 'unsure', 'scattered'
  ];
  const GROUNDED_TONE_INDICATORS = [
    'clear', 'ready', 'focused', 'excited', 'confident',
    'aligned', 'motivated', 'energized', 'certain', 'decided'
  ];
  
  let toneBias: CheckInPatterns['toneBias'] = 'neutral';
  if (checkInCount >= 2) {
    let softCount = 0;
    let groundedCount = 0;
    
    checkIns.forEach(ci => {
      const response = (ci.reflection_response || '').toLowerCase();
      SOFT_TONE_INDICATORS.forEach(word => {
        if (response.includes(word)) softCount++;
      });
      GROUNDED_TONE_INDICATORS.forEach(word => {
        if (response.includes(word)) groundedCount++;
      });
    });
    
    if (softCount > groundedCount + 2) toneBias = 'soft';
    else if (groundedCount > softCount + 2) toneBias = 'grounded';
  }
  
  // Confidence framing analysis
  let confidenceLevel: CheckInPatterns['confidenceLevel'] = 'balanced';
  if (checkInCount >= 2) {
    const unsureCount = checkIns.filter(
      ci => ci.orientation_choice === 'not_sure' || ci.orientation_choice === 'revisit_past'
    ).length;
    const decisiveCount = checkIns.filter(
      ci => ci.orientation_choice === 'continue_current' || ci.orientation_choice === 'start_new'
    ).length;
    
    if (unsureCount / checkInCount > 0.5) confidenceLevel = 'tentative';
    else if (decisiveCount / checkInCount > 0.7) confidenceLevel = 'decisive';
  }
  
  // Stability vs exploration analysis
  let orientationBias: CheckInPatterns['orientationBias'] = 'neutral';
  if (checkInCount >= 3) {
    const stabilityCount = checkIns.filter(
      ci => ci.orientation_choice === 'continue_current' || ci.orientation_choice === 'plan_relaunch'
    ).length;
    const explorationCount = checkIns.filter(
      ci => ci.orientation_choice === 'start_new'
    ).length;
    
    if (stabilityCount / checkInCount > 0.6) orientationBias = 'stability';
    else if (explorationCount / checkInCount > 0.4) orientationBias = 'exploration';
  }
  
  // Relaunch affinity
  let relaunchAffinity = false;
  if (checkInCount >= 2) {
    const relaunchCount = checkIns.filter(
      ci => ci.orientation_choice === 'plan_relaunch'
    ).length;
    relaunchAffinity = relaunchCount / checkInCount > 0.3;
  }
  
  return {
    toneBias,
    confidenceLevel,
    orientationBias,
    relaunchAffinity,
    checkInCount,
  };
}

export function usePlaybookData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['playbook-data', user?.id],
    queryFn: async (): Promise<PlaybookData> => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Fetch check-in patterns for tone influence
      const checkInPatterns = await fetchCheckInPatterns(user.id);
      
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
      
      // Generate insights with check-in pattern influence
      const insights = generateInsights({
        funnelTypes: sortedFunnelTypes.map(f => f.funnelType),
        hasConsistentAudience,
        hasConsistentProblem,
        hasConsistentOutcome,
        hasConsistentOffer,
        contentThemes: topThemes,
      }, checkInPatterns);
      
      // Determine messaging tone (influenced by check-in patterns)
      let toneDescription: string | null = null;
      if (completedProjectCount >= 1) {
        if (checkInPatterns?.toneBias === 'soft') {
          toneDescription = 'gentle and reassuring';
        } else if (checkInPatterns?.toneBias === 'grounded') {
          toneDescription = 'clear and confident';
        } else {
          toneDescription = 'clear and reassuring';
        }
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
