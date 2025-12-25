-- Add relaunch-related columns to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS parent_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_relaunch boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS relaunch_kept_sections text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS relaunch_revisit_sections text[] DEFAULT '{}';

-- Add index for efficient parent project lookups
CREATE INDEX IF NOT EXISTS idx_projects_parent_project_id ON public.projects(parent_project_id);

-- Add index for finding relaunch projects
CREATE INDEX IF NOT EXISTS idx_projects_is_relaunch ON public.projects(is_relaunch) WHERE is_relaunch = true;

-- Comment on columns for documentation
COMMENT ON COLUMN public.projects.parent_project_id IS 'Reference to the original project this relaunch is based on';
COMMENT ON COLUMN public.projects.is_relaunch IS 'Whether this project was created via Relaunch Mode';
COMMENT ON COLUMN public.projects.relaunch_kept_sections IS 'Sections the user chose to keep from the original project';
COMMENT ON COLUMN public.projects.relaunch_revisit_sections IS 'Sections the user chose to revisit in this relaunch';