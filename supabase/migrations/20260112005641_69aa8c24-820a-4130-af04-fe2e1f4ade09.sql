-- Create task_video_instructions table for storing video URLs per task
CREATE TABLE public.task_video_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE,
  video_url TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_video_instructions ENABLE ROW LEVEL SECURITY;

-- Everyone can view video instructions
CREATE POLICY "Anyone can view video instructions" 
ON public.task_video_instructions FOR SELECT 
USING (true);

-- Only admins can insert video instructions
CREATE POLICY "Admins can insert video instructions" 
ON public.task_video_instructions FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update video instructions
CREATE POLICY "Admins can update video instructions" 
ON public.task_video_instructions FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete video instructions
CREATE POLICY "Admins can delete video instructions" 
ON public.task_video_instructions FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_task_video_instructions_updated_at
BEFORE UPDATE ON public.task_video_instructions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();