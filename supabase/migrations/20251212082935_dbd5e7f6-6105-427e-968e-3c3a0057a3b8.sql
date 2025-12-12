-- Create content_planner table for persisting content items
CREATE TABLE public.content_planner (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL, -- 'week1', 'week2', 'week3', 'week4', 'launch'
  day_number INTEGER NOT NULL, -- 1-7
  time_of_day TEXT NOT NULL DEFAULT 'morning', -- 'morning', 'evening'
  content_type TEXT NOT NULL, -- 'high-value', 'story', 'testimonial', 'engagement', 'behind-scenes', 'buzz', 'offer-fomo', 'live', 'email'
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- The actual content/copy
  status TEXT NOT NULL DEFAULT 'planned', -- 'planned', 'in-progress', 'completed'
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_planner ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own content planner items"
  ON public.content_planner
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content planner items"
  ON public.content_planner
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content planner items"
  ON public.content_planner
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content planner items"
  ON public.content_planner
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_content_planner_updated_at
  BEFORE UPDATE ON public.content_planner
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();