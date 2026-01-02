-- Add metadata column to user_activity for storing additional event details
ALTER TABLE public.user_activity ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.user_activity.metadata IS 'Additional event details like task_name, assessment_name, etc.';