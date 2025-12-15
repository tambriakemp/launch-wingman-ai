-- Create table for tracking asset checklist completion
CREATE TABLE public.funnel_asset_completions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    asset_id TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, asset_id)
);

-- Enable RLS
ALTER TABLE public.funnel_asset_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own asset completions"
ON public.funnel_asset_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own asset completions"
ON public.funnel_asset_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own asset completions"
ON public.funnel_asset_completions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own asset completions"
ON public.funnel_asset_completions
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_funnel_asset_completions_updated_at
BEFORE UPDATE ON public.funnel_asset_completions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();