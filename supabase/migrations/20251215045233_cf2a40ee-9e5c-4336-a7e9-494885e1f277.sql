-- Create funnels table
CREATE TABLE public.funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  funnel_type TEXT NOT NULL,
  niche TEXT,
  target_audience TEXT,
  primary_pain_point TEXT,
  desired_outcome TEXT,
  problem_statement TEXT,
  funnel_platform TEXT,
  email_platform TEXT,
  community_platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Add new columns to offers table for funnel relationship
ALTER TABLE public.offers 
ADD COLUMN funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
ADD COLUMN slot_position INTEGER NOT NULL DEFAULT 0,
ADD COLUMN slot_type TEXT NOT NULL DEFAULT 'core',
ADD COLUMN is_required BOOLEAN NOT NULL DEFAULT true;

-- Remove the one-offer-per-project constraint by dropping the project_id unique constraint if it exists
-- (This allows multiple offers per project, linked via funnel)

-- Enable RLS on funnels
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for funnels
CREATE POLICY "Users can view their own funnels"
ON public.funnels
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own funnels"
ON public.funnels
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funnels"
ON public.funnels
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funnels"
ON public.funnels
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on funnels
CREATE TRIGGER update_funnels_updated_at
BEFORE UPDATE ON public.funnels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();