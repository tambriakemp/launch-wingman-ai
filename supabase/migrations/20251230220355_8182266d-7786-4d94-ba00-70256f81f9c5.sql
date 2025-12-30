-- Add page_id column for storing Facebook Page ID (required for Instagram posting)
ALTER TABLE public.social_connections 
ADD COLUMN IF NOT EXISTS page_id text;