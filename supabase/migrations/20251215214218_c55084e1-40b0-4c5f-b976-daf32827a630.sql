-- Add main_objections column to funnels table
ALTER TABLE public.funnels 
ADD COLUMN IF NOT EXISTS main_objections text;