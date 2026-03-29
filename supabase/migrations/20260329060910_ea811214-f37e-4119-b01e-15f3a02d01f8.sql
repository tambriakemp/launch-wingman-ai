CREATE TABLE public.personal_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  label TEXT DEFAULT 'Default',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.personal_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own keys" ON public.personal_api_keys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);