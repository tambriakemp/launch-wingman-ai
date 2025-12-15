-- Add pain_symptoms column to funnels table
ALTER TABLE public.funnels 
ADD COLUMN pain_symptoms jsonb DEFAULT '[]'::jsonb;