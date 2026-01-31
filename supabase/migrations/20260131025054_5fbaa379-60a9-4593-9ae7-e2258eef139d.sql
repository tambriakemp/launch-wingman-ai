-- Fix search_path for the increment function
CREATE OR REPLACE FUNCTION increment_resource_download(resource_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.content_vault_resources 
  SET download_count = download_count + 1 
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;