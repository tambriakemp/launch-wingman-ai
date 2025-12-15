-- Add time_effort_elements column to funnels table
ALTER TABLE public.funnels 
ADD COLUMN IF NOT EXISTS time_effort_elements jsonb DEFAULT '[]'::jsonb;