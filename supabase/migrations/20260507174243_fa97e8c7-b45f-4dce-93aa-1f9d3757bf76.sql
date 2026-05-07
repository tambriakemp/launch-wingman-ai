ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS time_of_day text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS reminder_times text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes text;