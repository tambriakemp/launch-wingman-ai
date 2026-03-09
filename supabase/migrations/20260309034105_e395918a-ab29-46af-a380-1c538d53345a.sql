CREATE TABLE IF NOT EXISTS public.daily_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_date date NOT NULL,
  intention text DEFAULT NULL,
  priority_1 text DEFAULT NULL,
  priority_1_done boolean NOT NULL DEFAULT false,
  priority_2 text DEFAULT NULL,
  priority_2_done boolean NOT NULL DEFAULT false,
  priority_3 text DEFAULT NULL,
  priority_3_done boolean NOT NULL DEFAULT false,
  notes text DEFAULT NULL,
  evening_reflection text DEFAULT NULL,
  gratitude text DEFAULT NULL,
  mood text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, page_date)
);

ALTER TABLE public.daily_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily pages" ON public.daily_pages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);