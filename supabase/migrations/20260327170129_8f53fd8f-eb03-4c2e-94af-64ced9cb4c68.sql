CREATE TABLE public.carousel_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  slide_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.carousel_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own" ON public.carousel_generations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own" ON public.carousel_generations FOR SELECT TO authenticated USING (auth.uid() = user_id);