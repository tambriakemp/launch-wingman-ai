-- Add preview_url column to content_vault_resources for storing Canva watch/preview links
ALTER TABLE public.content_vault_resources 
ADD COLUMN IF NOT EXISTS preview_url TEXT;