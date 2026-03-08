ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS recurrence_rule jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recurrence_exception_dates text[] DEFAULT NULL;