-- Add transformation_statement column to offers table
ALTER TABLE public.offers 
ADD COLUMN transformation_statement text;