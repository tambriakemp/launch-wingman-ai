-- Add funnel_type column to offers table
ALTER TABLE public.offers 
ADD COLUMN funnel_type TEXT;