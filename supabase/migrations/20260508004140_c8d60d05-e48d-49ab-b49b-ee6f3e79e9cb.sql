
-- Extend habits with pair_with, tag, reminder_time
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS pair_with_habit_id uuid REFERENCES public.habits(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tag text,
  ADD COLUMN IF NOT EXISTS reminder_time time;

-- Streak shields: 1 per user per month
CREATE TABLE IF NOT EXISTS public.habit_streak_shields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  used_date date NOT NULL,
  month_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);

ALTER TABLE public.habit_streak_shields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own shields" ON public.habit_streak_shields
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own shields" ON public.habit_streak_shields
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own shields" ON public.habit_streak_shields
  FOR DELETE USING (auth.uid() = user_id);

-- Sunday weekly reviews
CREATE TABLE IF NOT EXISTS public.habit_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  summary text,
  ai_suggestion text,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.habit_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own reviews" ON public.habit_reviews
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own reviews" ON public.habit_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own reviews" ON public.habit_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own reviews" ON public.habit_reviews
  FOR DELETE USING (auth.uid() = user_id);
