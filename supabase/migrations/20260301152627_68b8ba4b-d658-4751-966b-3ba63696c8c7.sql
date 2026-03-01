
-- Create ai_studio_projects table
CREATE TABLE public.ai_studio_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  mode TEXT NOT NULL DEFAULT 'vlog', -- 'vlog' or 'ugc'
  config JSONB NOT NULL DEFAULT '{}',
  storyboard JSONB, -- full storyboard data once generated
  character_preview_url TEXT,
  final_look_preview_url TEXT,
  status TEXT NOT NULL DEFAULT 'setup', -- 'setup', 'preview', 'storyboard'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_studio_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own AI studio projects"
  ON public.ai_studio_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI studio projects"
  ON public.ai_studio_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI studio projects"
  ON public.ai_studio_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI studio projects"
  ON public.ai_studio_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ai_studio_projects_updated_at
  BEFORE UPDATE ON public.ai_studio_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create ai-studio storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-studio', 'ai-studio', true);

-- Storage policies
CREATE POLICY "AI studio assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-studio');

CREATE POLICY "Authenticated users can upload AI studio assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ai-studio' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own AI studio assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'ai-studio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own AI studio assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ai-studio' AND auth.uid()::text = (storage.foldername(name))[1]);
