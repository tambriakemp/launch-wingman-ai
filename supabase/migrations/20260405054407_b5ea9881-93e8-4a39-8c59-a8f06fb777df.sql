
ALTER TABLE public.planner_spaces
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_pinned boolean DEFAULT false;
