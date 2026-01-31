-- Add download_count column to content_vault_resources
ALTER TABLE content_vault_resources 
ADD COLUMN IF NOT EXISTS download_count INTEGER NOT NULL DEFAULT 0;

-- Create function for atomic increment of download count
CREATE OR REPLACE FUNCTION increment_resource_download(resource_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE content_vault_resources 
  SET download_count = download_count + 1 
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;