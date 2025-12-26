-- Create metric_updates table for tracking monthly metric updates
CREATE TABLE public.metric_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  instagram_followers INTEGER,
  facebook_followers INTEGER,
  tiktok_followers INTEGER,
  email_list_size INTEGER,
  monthly_revenue NUMERIC,
  ytd_revenue NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.metric_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own metric updates"
ON public.metric_updates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metric updates"
ON public.metric_updates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metric updates"
ON public.metric_updates
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metric updates"
ON public.metric_updates
FOR DELETE
USING (auth.uid() = user_id);

-- Add last_metric_update column to launch_snapshots for reminder tracking
ALTER TABLE public.launch_snapshots 
ADD COLUMN IF NOT EXISTS last_metric_update TIMESTAMPTZ;

-- Create index for efficient queries
CREATE INDEX idx_metric_updates_project_id ON public.metric_updates(project_id);
CREATE INDEX idx_metric_updates_recorded_at ON public.metric_updates(recorded_at);