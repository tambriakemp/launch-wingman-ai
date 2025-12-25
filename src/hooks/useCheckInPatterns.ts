import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Check-in influence patterns for subtle Playbook tone adjustments.
 * 
 * CRITICAL RULES:
 * - These patterns ONLY influence language/tone
 * - They NEVER add new insights or change conclusions
 * - They require minimum thresholds before affecting anything
 * - They are NEVER surfaced directly to users
 */

export interface CheckInPatterns {
  // Tone sensitivity (2-3 check-ins required)
  toneBias: 'soft' | 'neutral' | 'grounded';
  
  // Confidence framing (2 check-ins required)
  confidenceLevel: 'tentative' | 'balanced' | 'decisive';
  
  // Stability vs exploration (3 check-ins required)
  orientationBias: 'stability' | 'neutral' | 'exploration';
  
  // Relaunch tendency (2 check-ins required)
  relaunchAffinity: boolean;
  
  // Meta - how many check-ins inform these patterns
  checkInCount: number;
}

// Thresholds for pattern activation
const THRESHOLDS = {
  toneSensitivity: 2,
  confidenceFraming: 2,
  stabilityExploration: 3,
  relaunchFraming: 2,
};

// Words indicating emotional weight in reflection responses
const SOFT_TONE_INDICATORS = [
  'overwhelmed', 'heavy', 'unclear', 'confused', 'stuck',
  'uncertain', 'anxious', 'tired', 'exhausted', 'lost',
  'frustrated', 'worried', 'unsure', 'scattered'
];

const GROUNDED_TONE_INDICATORS = [
  'clear', 'ready', 'focused', 'excited', 'confident',
  'aligned', 'motivated', 'energized', 'certain', 'decided'
];

/**
 * Analyzes check-in history to derive subtle patterns for Playbook tone adjustment.
 * 
 * This data is NEVER shown directly to users.
 * It only influences how Playbook insights are phrased.
 */
export function useCheckInPatterns() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['check-in-patterns', user?.id],
    queryFn: async (): Promise<CheckInPatterns> => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Fetch check-in history (all completed check-ins)
      const { data: checkIns, error } = await supabase
        .from('check_ins')
        .select('reflection_response, orientation_choice, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const checkInCount = checkIns?.length || 0;
      
      // Default neutral patterns (not enough data)
      const defaultPatterns: CheckInPatterns = {
        toneBias: 'neutral',
        confidenceLevel: 'balanced',
        orientationBias: 'neutral',
        relaunchAffinity: false,
        checkInCount,
      };
      
      if (checkInCount === 0) {
        return defaultPatterns;
      }
      
      // Analyze tone from reflection responses
      let toneBias: CheckInPatterns['toneBias'] = 'neutral';
      if (checkInCount >= THRESHOLDS.toneSensitivity) {
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
        
        if (softCount > groundedCount + 2) {
          toneBias = 'soft';
        } else if (groundedCount > softCount + 2) {
          toneBias = 'grounded';
        }
      }
      
      // Analyze confidence from orientation choices
      let confidenceLevel: CheckInPatterns['confidenceLevel'] = 'balanced';
      if (checkInCount >= THRESHOLDS.confidenceFraming) {
        const unsureCount = checkIns.filter(
          ci => ci.orientation_choice === 'not_sure' || ci.orientation_choice === 'revisit_past'
        ).length;
        
        const decisiveCount = checkIns.filter(
          ci => ci.orientation_choice === 'continue_current' || ci.orientation_choice === 'start_new'
        ).length;
        
        const ratio = unsureCount / checkInCount;
        if (ratio > 0.5) {
          confidenceLevel = 'tentative';
        } else if (decisiveCount / checkInCount > 0.7) {
          confidenceLevel = 'decisive';
        }
      }
      
      // Analyze stability vs exploration (needs more data)
      let orientationBias: CheckInPatterns['orientationBias'] = 'neutral';
      if (checkInCount >= THRESHOLDS.stabilityExploration) {
        const stabilityCount = checkIns.filter(
          ci => ci.orientation_choice === 'continue_current' || ci.orientation_choice === 'plan_relaunch'
        ).length;
        
        const explorationCount = checkIns.filter(
          ci => ci.orientation_choice === 'start_new'
        ).length;
        
        const stabilityRatio = stabilityCount / checkInCount;
        const explorationRatio = explorationCount / checkInCount;
        
        if (stabilityRatio > 0.6) {
          orientationBias = 'stability';
        } else if (explorationRatio > 0.4) {
          orientationBias = 'exploration';
        }
      }
      
      // Analyze relaunch affinity
      let relaunchAffinity = false;
      if (checkInCount >= THRESHOLDS.relaunchFraming) {
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
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 30, // 30 minutes - patterns don't need frequent updates
  });
}
