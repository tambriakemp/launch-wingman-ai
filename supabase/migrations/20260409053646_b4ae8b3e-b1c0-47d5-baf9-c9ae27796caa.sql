CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.platform_settings
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.platform_settings (key, value) 
VALUES ('image_model', 'gemini')
ON CONFLICT (key) DO NOTHING;