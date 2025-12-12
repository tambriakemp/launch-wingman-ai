-- Add price_type column to offers table
ALTER TABLE public.offers 
ADD COLUMN price_type text DEFAULT 'one-time';