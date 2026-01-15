-- Add thread_posts column to content_planner for storing thread chain replies
ALTER TABLE public.content_planner
ADD COLUMN thread_posts JSONB DEFAULT NULL;