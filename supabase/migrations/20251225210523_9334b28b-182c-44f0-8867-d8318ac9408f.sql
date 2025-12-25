-- Create user_tone_profiles table for AI tone learning
-- Stores style vectors and phrase preferences (style-only, never behavioral)
CREATE TABLE public.user_tone_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Style vector (bounded 0.0-1.0 floats)
  formality NUMERIC(3,2) NOT NULL DEFAULT 0.5 CHECK (formality >= 0 AND formality <= 1),
  energy NUMERIC(3,2) NOT NULL DEFAULT 0.3 CHECK (energy >= 0 AND energy <= 1),
  directness NUMERIC(3,2) NOT NULL DEFAULT 0.4 CHECK (directness >= 0 AND directness <= 1),
  warmth NUMERIC(3,2) NOT NULL DEFAULT 0.6 CHECK (warmth >= 0 AND warmth <= 1),
  sentence_length NUMERIC(3,2) NOT NULL DEFAULT 0.4 CHECK (sentence_length >= 0 AND sentence_length <= 1),
  emoji_usage NUMERIC(3,2) NOT NULL DEFAULT 0.1 CHECK (emoji_usage >= 0 AND emoji_usage <= 0.5),
  salesy_tolerance NUMERIC(3,2) NOT NULL DEFAULT 0.2 CHECK (salesy_tolerance >= 0 AND salesy_tolerance <= 0.5),
  
  -- Phrase preferences (whitelist only)
  preferred_phrases TEXT[] NOT NULL DEFAULT ARRAY['invite', 'simple', 'clear', 'step-by-step']::TEXT[],
  avoided_phrases TEXT[] NOT NULL DEFAULT ARRAY['urgency', 'limited time', 'act now', 'dont miss']::TEXT[],
  
  -- Evidence counts for stability
  evidence_formality INTEGER NOT NULL DEFAULT 0,
  evidence_energy INTEGER NOT NULL DEFAULT 0,
  evidence_directness INTEGER NOT NULL DEFAULT 0,
  evidence_warmth INTEGER NOT NULL DEFAULT 0,
  evidence_sentence_length INTEGER NOT NULL DEFAULT 0,
  evidence_emoji_usage INTEGER NOT NULL DEFAULT 0,
  evidence_salesy_tolerance INTEGER NOT NULL DEFAULT 0,
  
  -- User explicit setting
  writing_style TEXT NOT NULL DEFAULT 'calm' CHECK (writing_style IN ('calm', 'direct', 'encouraging', 'minimal', 'detailed')),
  tone_learning_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Anti-volatility
  last_updated_source TEXT,
  cooldown_until TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_tone_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own tone profile"
  ON public.user_tone_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tone profile"
  ON public.user_tone_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tone profile"
  ON public.user_tone_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tone profile"
  ON public.user_tone_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_tone_profiles_updated_at
  BEFORE UPDATE ON public.user_tone_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();