ALTER TABLE public.ai_studio_projects ADD COLUMN IF NOT EXISTS reel_url text;
ALTER TABLE public.ai_studio_projects ADD COLUMN IF NOT EXISTS reel_path text;
ALTER TABLE public.ai_studio_projects ADD COLUMN IF NOT EXISTS reel_created_at timestamptz;