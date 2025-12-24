-- Create project_tasks table to store task instances for each project
CREATE TABLE public.project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  input_data JSONB DEFAULT '{}'::jsonb,
  skip_reason TEXT CHECK (skip_reason IN ('not_relevant', 'already_completed', 'doing_later') OR skip_reason IS NULL),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, task_id)
);

-- Add phase tracking columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS active_phase TEXT DEFAULT 'planning' CHECK (active_phase IN ('planning', 'messaging', 'build', 'content', 'launch', 'post-launch')),
ADD COLUMN IF NOT EXISTS selected_funnel_type TEXT CHECK (selected_funnel_type IN ('webinar', 'challenge', 'direct-sales', 'lead-magnet') OR selected_funnel_type IS NULL),
ADD COLUMN IF NOT EXISTS phase_statuses JSONB DEFAULT '{"planning": "active", "messaging": "locked", "build": "locked", "content": "locked", "launch": "locked", "post-launch": "locked"}'::jsonb;

-- Enable RLS on project_tasks
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_tasks
CREATE POLICY "Users can view their own project tasks"
ON public.project_tasks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project tasks"
ON public.project_tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project tasks"
ON public.project_tasks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project tasks"
ON public.project_tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_project_tasks_updated_at
BEFORE UPDATE ON public.project_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX idx_project_tasks_task_id ON public.project_tasks(task_id);