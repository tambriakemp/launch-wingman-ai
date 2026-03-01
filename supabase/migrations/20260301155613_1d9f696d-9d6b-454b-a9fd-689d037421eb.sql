
CREATE TABLE public.ai_studio_environments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_studio_environments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own environments"
ON public.ai_studio_environments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own environments"
ON public.ai_studio_environments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own environments"
ON public.ai_studio_environments FOR DELETE
USING (auth.uid() = user_id);
