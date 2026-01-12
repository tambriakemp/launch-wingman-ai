-- Add preview_url column to content_vault_resources for storing PDF preview URLs
-- This allows storing the original file for download while having a PDF version for preview
ALTER TABLE public.content_vault_resources 
ADD COLUMN IF NOT EXISTS preview_url TEXT;