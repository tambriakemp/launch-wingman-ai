-- Add phase column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN phase text DEFAULT NULL;

-- Create index for better filtering performance
CREATE INDEX idx_tasks_phase ON public.tasks(phase);