-- Create email_sequences table
CREATE TABLE public.email_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deliverable_copy table
CREATE TABLE public.deliverable_copy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_copy ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_sequences
CREATE POLICY "Users can view their own email sequences"
ON public.email_sequences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email sequences"
ON public.email_sequences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email sequences"
ON public.email_sequences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email sequences"
ON public.email_sequences FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for deliverable_copy
CREATE POLICY "Users can view their own deliverable copy"
ON public.deliverable_copy FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deliverable copy"
ON public.deliverable_copy FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deliverable copy"
ON public.deliverable_copy FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deliverable copy"
ON public.deliverable_copy FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_email_sequences_updated_at
BEFORE UPDATE ON public.email_sequences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliverable_copy_updated_at
BEFORE UPDATE ON public.deliverable_copy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();