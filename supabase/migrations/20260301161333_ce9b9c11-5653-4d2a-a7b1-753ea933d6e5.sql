
CREATE TABLE public.ai_studio_saved_looks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  settings jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_studio_saved_looks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved looks"
  ON public.ai_studio_saved_looks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved looks"
  ON public.ai_studio_saved_looks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved looks"
  ON public.ai_studio_saved_looks FOR DELETE
  USING (auth.uid() = user_id);
