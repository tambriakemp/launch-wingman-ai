-- Add project_type column to projects table
ALTER TABLE public.projects 
ADD COLUMN project_type text NOT NULL DEFAULT 'launch';

-- Add check constraint for valid project types
ALTER TABLE public.projects 
ADD CONSTRAINT projects_type_check CHECK (project_type IN ('launch', 'prelaunch'));