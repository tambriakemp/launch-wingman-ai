-- Create content_ideas table for saved talking points
CREATE TABLE public.content_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'general',
  phase TEXT,
  funnel_type TEXT,
  is_saved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_drafts table for draft posts
CREATE TABLE public.content_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content_idea_id UUID REFERENCES public.content_ideas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'general',
  phase TEXT,
  funnel_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_ideas
CREATE POLICY "Users can view their own content ideas"
  ON public.content_ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content ideas"
  ON public.content_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content ideas"
  ON public.content_ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content ideas"
  ON public.content_ideas FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for content_drafts
CREATE POLICY "Users can view their own content drafts"
  ON public.content_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content drafts"
  ON public.content_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content drafts"
  ON public.content_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content drafts"
  ON public.content_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_content_ideas_project_id ON public.content_ideas(project_id);
CREATE INDEX idx_content_ideas_user_id ON public.content_ideas(user_id);
CREATE INDEX idx_content_ideas_is_saved ON public.content_ideas(is_saved);
CREATE INDEX idx_content_drafts_project_id ON public.content_drafts(project_id);
CREATE INDEX idx_content_drafts_user_id ON public.content_drafts(user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_content_ideas_updated_at
  BEFORE UPDATE ON public.content_ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_drafts_updated_at
  BEFORE UPDATE ON public.content_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();