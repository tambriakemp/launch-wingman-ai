-- Create project_memory table to track memory elements that need review
-- This supports the "Adaptive Memory" layer - elements that persist with needs_review flag
CREATE TABLE public.project_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  memory_key TEXT NOT NULL,
  needs_review BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, memory_key)
);

-- Enable RLS
ALTER TABLE public.project_memory ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own project memory"
ON public.project_memory FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project memory"
ON public.project_memory FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project memory"
ON public.project_memory FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project memory"
ON public.project_memory FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_project_memory_updated_at
BEFORE UPDATE ON public.project_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add skip_memory column to projects table for "Start without using past projects" option
ALTER TABLE public.projects ADD COLUMN skip_memory BOOLEAN NOT NULL DEFAULT false;