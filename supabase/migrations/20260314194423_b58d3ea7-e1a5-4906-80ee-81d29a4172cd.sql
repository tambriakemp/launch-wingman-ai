
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT NULL,
  category text NOT NULL DEFAULT 'business',
  color text NOT NULL DEFAULT '#f5c842',
  why_statement text DEFAULT NULL,
  target_date date DEFAULT NULL,
  status text NOT NULL DEFAULT 'active',
  quarter text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  due_date date DEFAULT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own goal milestones" ON public.goal_milestones
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.brain_dump_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'inbox',
  processed_as text DEFAULT NULL,
  processed_id text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brain_dump_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own brain dump items" ON public.brain_dump_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
