import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Bounded style attributes
export interface ToneStyleVector {
  formality: number;      // 0 = casual, 1 = professional
  energy: number;         // 0 = calm, 1 = high
  directness: number;     // 0 = gentle, 1 = direct
  warmth: number;         // 0 = neutral, 1 = warm
  sentence_length: number; // 0 = short, 1 = long
  emoji_usage: number;    // 0 = none, 0.5 = light (capped)
  salesy_tolerance: number; // 0 = low, 0.5 = medium (capped)
}

export interface ToneProfile {
  id: string;
  user_id: string;
  version: number;
  writing_style: 'calm' | 'direct' | 'encouraging' | 'minimal' | 'detailed';
  tone_learning_enabled: boolean;
  preferred_phrases: string[];
  avoided_phrases: string[];
  cooldown_until: string | null;
  last_updated_source: string | null;
  // Style vector
  formality: number;
  energy: number;
  directness: number;
  warmth: number;
  sentence_length: number;
  emoji_usage: number;
  salesy_tolerance: number;
  // Evidence counts
  evidence_formality: number;
  evidence_energy: number;
  evidence_directness: number;
  evidence_warmth: number;
  evidence_sentence_length: number;
  evidence_emoji_usage: number;
  evidence_salesy_tolerance: number;
}

// Uncertainty keywords from check-ins (allowlist only)
const UNCERTAINTY_KEYWORDS = ['overwhelmed', 'unclear', 'stuck', 'heavy', 'confused', 'unsure'];

// Default profile values
const DEFAULT_PROFILE: Omit<ToneProfile, 'id' | 'user_id'> = {
  version: 1,
  writing_style: 'calm',
  tone_learning_enabled: true,
  preferred_phrases: ['invite', 'simple', 'clear', 'step-by-step'],
  avoided_phrases: ['urgency', 'limited time', 'act now', 'dont miss'],
  cooldown_until: null,
  last_updated_source: null,
  formality: 0.5,
  energy: 0.3,
  directness: 0.4,
  warmth: 0.6,
  sentence_length: 0.4,
  emoji_usage: 0.1,
  salesy_tolerance: 0.2,
  evidence_formality: 0,
  evidence_energy: 0,
  evidence_directness: 0,
  evidence_warmth: 0,
  evidence_sentence_length: 0,
  evidence_emoji_usage: 0,
  evidence_salesy_tolerance: 0,
};

// Max change per update (anti-volatility)
const MAX_DELTA = 0.05;
const COOLDOWN_DAYS = 7;
const MIN_EVIDENCE_THRESHOLD = 2;

// Clamp value within bounds
const clamp = (value: number, min: number, max: number) => 
  Math.max(min, Math.min(max, value));

// Extract lightweight style features from text
export function extractStyleFeatures(text: string): Partial<ToneStyleVector> {
  if (!text || text.trim().length < 10) return {};

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  const features: Partial<ToneStyleVector> = {};

  // Average sentence length (short=0.2, medium=0.5, long=0.8)
  if (sentences.length > 0) {
    const avgLength = words.length / sentences.length;
    if (avgLength < 10) features.sentence_length = 0.2;
    else if (avgLength < 20) features.sentence_length = 0.5;
    else features.sentence_length = 0.8;
  }

  // Contraction usage → casual/informal
  const contractions = (text.match(/\b(can't|won't|don't|isn't|aren't|I'm|you're|we're|they're|it's|that's|what's|here's|there's|let's)\b/gi) || []).length;
  if (contractions > 0) {
    features.formality = Math.max(0.2, 0.5 - (contractions * 0.05));
  }

  // Emoji count (hard-capped at 0.5)
  const emojis = (text.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
  if (emojis > 0) {
    features.emoji_usage = Math.min(0.5, emojis * 0.1);
  }

  // Warmth indicators
  const warmPhrases = ['you can', 'you might', 'feel free', 'whenever', 'no pressure', 'take your time'];
  const warmCount = warmPhrases.filter(p => text.toLowerCase().includes(p)).length;
  if (warmCount > 0) {
    features.warmth = Math.min(1, 0.5 + (warmCount * 0.1));
    features.directness = Math.max(0, 0.5 - (warmCount * 0.1));
  }

  // Direct indicators
  const directPhrases = ['you should', 'you need', 'you must', 'do this', 'make sure'];
  const directCount = directPhrases.filter(p => text.toLowerCase().includes(p)).length;
  if (directCount > 0) {
    features.directness = Math.min(1, 0.5 + (directCount * 0.1));
  }

  // Energy indicators
  const exclamations = (text.match(/!/g) || []).length;
  const capsWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
  if (exclamations > 1 || capsWords > 0) {
    features.energy = Math.min(1, 0.3 + (exclamations * 0.1) + (capsWords * 0.15));
  }

  return features;
}

// Extract uncertainty signals from check-in text
export function extractUncertaintySignal(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return UNCERTAINTY_KEYWORDS.some(kw => lower.includes(kw));
}

// Compute diff-based deltas from user edits (preferred signal)
export function extractEditDeltas(original: string, edited: string): Partial<ToneStyleVector> {
  if (!original || !edited) return {};
  
  const deltas: Partial<ToneStyleVector> = {};
  
  // Check for hype word removal
  const hypeWords = ['amazing', 'incredible', 'explosive', 'massive', 'insane', 'crazy', 'revolutionary'];
  const originalHype = hypeWords.filter(w => original.toLowerCase().includes(w)).length;
  const editedHype = hypeWords.filter(w => edited.toLowerCase().includes(w)).length;
  
  if (editedHype < originalHype) {
    deltas.salesy_tolerance = -0.05 * (originalHype - editedHype);
  }

  // Check for softened imperatives
  const imperatives = ['you should', 'you need to', 'you must'];
  const softened = ['you can', 'you might', 'you could'];
  
  const originalImperatives = imperatives.filter(p => original.toLowerCase().includes(p)).length;
  const editedSoftened = softened.filter(p => edited.toLowerCase().includes(p)).length;
  
  if (originalImperatives > 0 && editedSoftened > 0) {
    deltas.directness = -0.05;
    deltas.warmth = 0.05;
  }

  // Check for length reduction
  const originalWords = original.split(/\s+/).length;
  const editedWords = edited.split(/\s+/).length;
  
  if (editedWords < originalWords * 0.7) {
    deltas.sentence_length = -0.05;
  }

  // Check for exclamation removal
  const originalExcl = (original.match(/!/g) || []).length;
  const editedExcl = (edited.match(/!/g) || []).length;
  
  if (editedExcl < originalExcl) {
    deltas.energy = -0.03 * (originalExcl - editedExcl);
  }

  return deltas;
}

export function useToneLearning() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch or create tone profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['tone-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_tone_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching tone profile:', error);
        throw error;
      }

      if (!data) {
        // Create default profile
        const { data: newProfile, error: insertError } = await supabase
          .from('user_tone_profiles')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating tone profile:', insertError);
          throw insertError;
        }
        
        return newProfile as ToneProfile;
      }

      return data as ToneProfile;
    },
    enabled: !!user?.id,
  });

  // Check if in cooldown period
  const isInCooldown = useCallback(() => {
    if (!profile?.cooldown_until) return false;
    return new Date(profile.cooldown_until) > new Date();
  }, [profile]);

  // Update writing style (explicit user setting)
  const updateWritingStyleMutation = useMutation({
    mutationFn: async (style: ToneProfile['writing_style']) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_tone_profiles')
        .update({ 
          writing_style: style,
          last_updated_source: 'user_explicit',
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tone-profile', user?.id] });
    },
  });

  // Toggle tone learning
  const toggleToneLearningMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_tone_profiles')
        .update({ tone_learning_enabled: enabled })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tone-profile', user?.id] });
    },
  });

  // Reset tone profile to defaults
  const resetProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_tone_profiles')
        .update({
          version: (profile?.version || 0) + 1,
          formality: 0.5,
          energy: 0.3,
          directness: 0.4,
          warmth: 0.6,
          sentence_length: 0.4,
          emoji_usage: 0.1,
          salesy_tolerance: 0.2,
          evidence_formality: 0,
          evidence_energy: 0,
          evidence_directness: 0,
          evidence_warmth: 0,
          evidence_sentence_length: 0,
          evidence_emoji_usage: 0,
          evidence_salesy_tolerance: 0,
          cooldown_until: null,
          last_updated_source: 'user_reset',
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tone-profile', user?.id] });
    },
  });

  // Record style signal from user-written text (accumulates evidence)
  const recordTextSignal = useCallback(async (text: string, source: string) => {
    if (!user?.id || !profile || !profile.tone_learning_enabled) return;
    
    const features = extractStyleFeatures(text);
    if (Object.keys(features).length === 0) return;

    // Accumulate evidence counts without updating values yet
    const evidenceUpdates: Record<string, number> = {};
    
    Object.keys(features).forEach(key => {
      const evidenceKey = `evidence_${key}` as keyof ToneProfile;
      if (evidenceKey in profile) {
        evidenceUpdates[evidenceKey] = (profile[evidenceKey] as number) + 1;
      }
    });

    // Only update if we have accumulated enough evidence and not in cooldown
    if (isInCooldown()) {
      // Just accumulate evidence, don't update values
      await supabase
        .from('user_tone_profiles')
        .update(evidenceUpdates)
        .eq('user_id', user.id);
      return;
    }

    // Check if any attribute has enough evidence to update
    const styleUpdates: Record<string, number> = {};
    
    Object.entries(features).forEach(([key, value]) => {
      if (value === undefined) return;
      
      const evidenceKey = `evidence_${key}` as keyof ToneProfile;
      const currentEvidence = (profile[evidenceKey] as number) || 0;
      
      if (currentEvidence + 1 >= MIN_EVIDENCE_THRESHOLD) {
        const currentValue = profile[key as keyof ToneProfile] as number;
        const delta = clamp(value - currentValue, -MAX_DELTA, MAX_DELTA);
        
        // Apply bounded update
        let newValue = currentValue + delta;
        
        // Enforce hard caps
        if (key === 'emoji_usage' || key === 'salesy_tolerance') {
          newValue = clamp(newValue, 0, 0.5);
        } else {
          newValue = clamp(newValue, 0, 1);
        }
        
        styleUpdates[key] = newValue;
      }
    });

    if (Object.keys(styleUpdates).length > 0) {
      // Set cooldown
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() + COOLDOWN_DAYS);

      await supabase
        .from('user_tone_profiles')
        .update({
          ...styleUpdates,
          ...evidenceUpdates,
          cooldown_until: cooldownDate.toISOString(),
          last_updated_source: source,
        })
        .eq('user_id', user.id);

      queryClient.invalidateQueries({ queryKey: ['tone-profile', user?.id] });
    } else if (Object.keys(evidenceUpdates).length > 0) {
      await supabase
        .from('user_tone_profiles')
        .update(evidenceUpdates)
        .eq('user_id', user.id);
    }
  }, [user?.id, profile, isInCooldown, queryClient]);

  // Record edit signal (diff-based, preferred signal)
  const recordEditSignal = useCallback(async (original: string, edited: string) => {
    if (!user?.id || !profile || !profile.tone_learning_enabled) return;
    if (isInCooldown()) return;

    const deltas = extractEditDeltas(original, edited);
    if (Object.keys(deltas).length === 0) return;

    const styleUpdates: Record<string, number> = {};
    const evidenceUpdates: Record<string, number> = {};

    Object.entries(deltas).forEach(([key, delta]) => {
      if (delta === undefined) return;
      
      const currentValue = profile[key as keyof ToneProfile] as number;
      const boundedDelta = clamp(delta, -MAX_DELTA, MAX_DELTA);
      
      let newValue = currentValue + boundedDelta;
      
      // Enforce hard caps
      if (key === 'emoji_usage' || key === 'salesy_tolerance') {
        newValue = clamp(newValue, 0, 0.5);
      } else {
        newValue = clamp(newValue, 0, 1);
      }
      
      styleUpdates[key] = newValue;
      
      const evidenceKey = `evidence_${key}`;
      evidenceUpdates[evidenceKey] = ((profile[evidenceKey as keyof ToneProfile] as number) || 0) + 1;
    });

    if (Object.keys(styleUpdates).length > 0) {
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() + COOLDOWN_DAYS);

      await supabase
        .from('user_tone_profiles')
        .update({
          ...styleUpdates,
          ...evidenceUpdates,
          cooldown_until: cooldownDate.toISOString(),
          last_updated_source: 'user_edit',
        })
        .eq('user_id', user.id);

      queryClient.invalidateQueries({ queryKey: ['tone-profile', user?.id] });
    }
  }, [user?.id, profile, isInCooldown, queryClient]);

  // Record uncertainty signal from check-in (highly restricted)
  const recordCheckInUncertainty = useCallback(async (text: string) => {
    if (!user?.id || !profile || !profile.tone_learning_enabled) return;
    if (!extractUncertaintySignal(text)) return;
    if (isInCooldown()) return;

    // Only slightly adjust warmth and directness
    const newWarmth = clamp(profile.warmth + 0.02, 0, 1);
    const newDirectness = clamp(profile.directness - 0.02, 0, 1);

    await supabase
      .from('user_tone_profiles')
      .update({
        warmth: newWarmth,
        directness: newDirectness,
        evidence_warmth: profile.evidence_warmth + 1,
        evidence_directness: profile.evidence_directness + 1,
        last_updated_source: 'check_in',
      })
      .eq('user_id', user.id);

    queryClient.invalidateQueries({ queryKey: ['tone-profile', user?.id] });
  }, [user?.id, profile, isInCooldown, queryClient]);

  // Get style vector for AI prompts
  const getStyleVector = useCallback((): ToneStyleVector => {
    if (!profile) {
      return {
        formality: 0.5,
        energy: 0.3,
        directness: 0.4,
        warmth: 0.6,
        sentence_length: 0.4,
        emoji_usage: 0.1,
        salesy_tolerance: 0.2,
      };
    }

    return {
      formality: profile.formality,
      energy: profile.energy,
      directness: profile.directness,
      warmth: profile.warmth,
      sentence_length: profile.sentence_length,
      emoji_usage: profile.emoji_usage,
      salesy_tolerance: profile.salesy_tolerance,
    };
  }, [profile]);

  // Get AI prompt modifiers based on style
  const getAIPromptModifiers = useCallback((): string => {
    if (!profile || !profile.tone_learning_enabled) {
      return '';
    }

    const modifiers: string[] = [];

    // Formality
    if (profile.formality < 0.3) {
      modifiers.push('Use casual, conversational language.');
    } else if (profile.formality > 0.7) {
      modifiers.push('Use professional, polished language.');
    }

    // Energy
    if (profile.energy < 0.3) {
      modifiers.push('Keep the tone calm and measured.');
    } else if (profile.energy > 0.6) {
      modifiers.push('Use an upbeat, energetic tone.');
    }

    // Directness
    if (profile.directness < 0.3) {
      modifiers.push('Use gentle, suggestive phrasing like "you might" or "you could".');
    } else if (profile.directness > 0.7) {
      modifiers.push('Be clear and direct in recommendations.');
    }

    // Warmth
    if (profile.warmth > 0.7) {
      modifiers.push('Use warm, encouraging language.');
    }

    // Sentence length
    if (profile.sentence_length < 0.3) {
      modifiers.push('Keep sentences short and punchy.');
    } else if (profile.sentence_length > 0.7) {
      modifiers.push('Use flowing, detailed sentences.');
    }

    // Writing style preset
    switch (profile.writing_style) {
      case 'direct':
        modifiers.push('Be concise and action-oriented.');
        break;
      case 'encouraging':
        modifiers.push('Be supportive and affirming.');
        break;
      case 'minimal':
        modifiers.push('Use minimal words, maximum clarity.');
        break;
      case 'detailed':
        modifiers.push('Provide thorough explanations.');
        break;
      case 'calm':
      default:
        modifiers.push('Maintain a calm, reassuring tone.');
    }

    // Hard rules (always enforced)
    modifiers.push('Never use hype or urgency language.');
    modifiers.push('Avoid claims about "best practices" or optimization.');
    modifiers.push('Prefer "you can" or "you might" over "you should".');
    modifiers.push('Keep output concise unless more detail is requested.');

    return modifiers.join(' ');
  }, [profile]);

  return {
    profile,
    isLoading,
    isInCooldown: isInCooldown(),
    
    // User controls
    updateWritingStyle: updateWritingStyleMutation.mutate,
    toggleToneLearning: toggleToneLearningMutation.mutate,
    resetProfile: resetProfileMutation.mutate,
    
    // Learning signals
    recordTextSignal,
    recordEditSignal,
    recordCheckInUncertainty,
    
    // AI integration
    getStyleVector,
    getAIPromptModifiers,
    
    // Loading states
    isUpdatingStyle: updateWritingStyleMutation.isPending,
    isResetting: resetProfileMutation.isPending,
  };
}
