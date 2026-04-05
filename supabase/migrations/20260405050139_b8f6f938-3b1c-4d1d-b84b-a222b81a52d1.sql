
-- Create goal_folders table
CREATE TABLE public.goal_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goal_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for goal_folders
CREATE POLICY "Users can view own folders" ON public.goal_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own folders" ON public.goal_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON public.goal_folders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON public.goal_folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add folder_id to goals table
ALTER TABLE public.goals ADD COLUMN folder_id UUID REFERENCES public.goal_folders(id) ON DELETE SET NULL;

-- Add description to goals table (for ClickUp-style notes)
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;
