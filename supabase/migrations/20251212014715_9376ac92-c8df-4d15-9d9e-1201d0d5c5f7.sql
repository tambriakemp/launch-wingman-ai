-- Add labels column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN labels TEXT[] DEFAULT '{}';