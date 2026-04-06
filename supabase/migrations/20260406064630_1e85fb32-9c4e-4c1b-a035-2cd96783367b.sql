
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  niche TEXT DEFAULT '',
  aesthetic TEXT DEFAULT '',
  personality_traits TEXT DEFAULT '',
  target_audience TEXT DEFAULT '',
  brand_colors TEXT DEFAULT '',
  photo_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own characters" ON public.characters
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own characters" ON public.characters
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters" ON public.characters
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters" ON public.characters
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
