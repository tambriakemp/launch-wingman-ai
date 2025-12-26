-- Create launch_snapshots table for Insights feature
CREATE TABLE public.launch_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('starting', 'ending')),
  
  -- Audience metrics (all optional)
  instagram_followers INTEGER,
  facebook_followers INTEGER,
  tiktok_followers INTEGER,
  email_list_size INTEGER,
  
  -- Revenue baseline (optional)
  monthly_revenue NUMERIC,
  ytd_revenue NUMERIC,
  
  -- Confidence level (optional) - for starting snapshot
  confidence_level TEXT CHECK (confidence_level IN ('unsure', 'somewhat', 'confident')),
  
  -- End of launch metrics (optional) - for ending snapshot
  sales_count INTEGER,
  launch_revenue NUMERIC,
  new_followers INTEGER,
  email_list_growth INTEGER,
  
  -- Reflection
  reflection_note TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.launch_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own launch snapshots"
ON public.launch_snapshots
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own launch snapshots"
ON public.launch_snapshots
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own launch snapshots"
ON public.launch_snapshots
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own launch snapshots"
ON public.launch_snapshots
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_launch_snapshots_updated_at
BEFORE UPDATE ON public.launch_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_launch_snapshots_project ON public.launch_snapshots(project_id);
CREATE INDEX idx_launch_snapshots_user ON public.launch_snapshots(user_id);