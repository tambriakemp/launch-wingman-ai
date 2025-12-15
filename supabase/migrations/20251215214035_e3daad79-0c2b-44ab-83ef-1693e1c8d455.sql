-- Add likelihood_elements column to funnels table
ALTER TABLE public.funnels 
ADD COLUMN IF NOT EXISTS likelihood_elements jsonb DEFAULT '[]'::jsonb;