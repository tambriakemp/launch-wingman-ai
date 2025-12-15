-- Add new columns for WHO section enhancements
ALTER TABLE public.funnels
ADD COLUMN IF NOT EXISTS sub_audiences jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS specificity_score integer DEFAULT 0;