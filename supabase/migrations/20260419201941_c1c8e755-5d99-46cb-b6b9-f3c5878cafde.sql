ALTER TABLE public.content_vault_resources
ADD COLUMN IF NOT EXISTS content_hash text;

CREATE INDEX IF NOT EXISTS idx_content_vault_resources_content_hash
ON public.content_vault_resources(content_hash)
WHERE content_hash IS NOT NULL;