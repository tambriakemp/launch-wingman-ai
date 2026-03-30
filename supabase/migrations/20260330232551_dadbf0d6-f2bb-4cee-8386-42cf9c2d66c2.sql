
-- Create goal_targets table
CREATE TABLE public.goal_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  target_type text NOT NULL DEFAULT 'number',
  unit text DEFAULT NULL,
  start_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 1,
  current_value numeric NOT NULL DEFAULT 0,
  is_done boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create goal_target_updates table
CREATE TABLE public.goal_target_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid NOT NULL REFERENCES public.goal_targets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  previous_value numeric NOT NULL,
  new_value numeric NOT NULL,
  note text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for goal_targets
ALTER TABLE public.goal_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goal targets"
ON public.goal_targets FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS for goal_target_updates
ALTER TABLE public.goal_target_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goal target updates"
ON public.goal_target_updates FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Drop quarter column from goals
ALTER TABLE public.goals DROP COLUMN IF EXISTS quarter;
