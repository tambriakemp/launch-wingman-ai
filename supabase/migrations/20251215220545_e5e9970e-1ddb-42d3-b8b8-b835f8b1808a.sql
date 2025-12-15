-- Add transformation builder columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS transformation_style text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS transformation_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS transformation_versions jsonb DEFAULT NULL;