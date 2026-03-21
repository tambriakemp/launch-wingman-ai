CREATE TABLE IF NOT EXISTS public.idea_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text DEFAULT NULL,
  platform text NOT NULL DEFAULT 'any',
  format text NOT NULL DEFAULT 'post',
  status text NOT NULL DEFAULT 'idea',
  category text NOT NULL DEFAULT 'educational',
  hook text DEFAULT NULL,
  promoted_to text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.idea_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own idea bank" ON public.idea_bank
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);