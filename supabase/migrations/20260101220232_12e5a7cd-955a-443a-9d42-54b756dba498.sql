-- Create table for persisting AI-generated timeline suggestions
CREATE TABLE public.timeline_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  phase TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  time_of_day TEXT NOT NULL,
  template_type TEXT NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure only one suggestion per slot
  UNIQUE(project_id, phase, day_number, time_of_day)
);

-- Enable Row Level Security
ALTER TABLE public.timeline_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own timeline suggestions"
ON public.timeline_suggestions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own timeline suggestions"
ON public.timeline_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline suggestions"
ON public.timeline_suggestions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeline suggestions"
ON public.timeline_suggestions
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_timeline_suggestions_updated_at
BEFORE UPDATE ON public.timeline_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();