-- Add transformation_statement column to projects table
ALTER TABLE public.projects 
ADD COLUMN transformation_statement TEXT DEFAULT NULL;