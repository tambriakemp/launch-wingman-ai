-- Create a table for launch calendar events
CREATE TABLE public.launch_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'launch', -- 'launch' or 'prelaunch'
  prelaunch_start DATE,
  content_creation_start DATE,
  enrollment_opens DATE,
  enrollment_closes DATE,
  program_delivery_start DATE,
  program_delivery_end DATE,
  rest_period_start DATE,
  rest_period_end DATE,
  program_weeks INTEGER DEFAULT 8,
  rest_weeks INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.launch_events ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own launch events" 
ON public.launch_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own launch events" 
ON public.launch_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own launch events" 
ON public.launch_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own launch events" 
ON public.launch_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_launch_events_updated_at
BEFORE UPDATE ON public.launch_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();