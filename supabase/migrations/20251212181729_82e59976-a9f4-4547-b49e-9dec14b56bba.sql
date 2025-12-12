-- Add new columns to offers table for audience discovery
ALTER TABLE public.offers 
ADD COLUMN target_audience text,
ADD COLUMN primary_pain_point text,
ADD COLUMN desired_outcome text,
ADD COLUMN problem_statement text;