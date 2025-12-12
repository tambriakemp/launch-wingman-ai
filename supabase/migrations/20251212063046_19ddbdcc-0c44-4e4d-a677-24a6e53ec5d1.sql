-- Add main_deliverables column to offers table
ALTER TABLE public.offers ADD COLUMN main_deliverables text[] DEFAULT '{}'::text[];