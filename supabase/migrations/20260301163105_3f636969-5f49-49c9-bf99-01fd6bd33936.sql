
-- Create environment groups table
CREATE TABLE public.ai_studio_environment_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_studio_environment_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own environment groups"
  ON public.ai_studio_environment_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own environment groups"
  ON public.ai_studio_environment_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own environment groups"
  ON public.ai_studio_environment_groups FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own environment groups"
  ON public.ai_studio_environment_groups FOR UPDATE
  USING (auth.uid() = user_id);

-- Add group_id column to existing environments table
ALTER TABLE public.ai_studio_environments
  ADD COLUMN group_id UUID REFERENCES public.ai_studio_environment_groups(id) ON DELETE CASCADE;
