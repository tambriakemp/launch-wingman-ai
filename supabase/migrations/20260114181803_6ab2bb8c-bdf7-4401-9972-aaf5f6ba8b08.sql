-- Add avatar_url column to social_connections table
ALTER TABLE public.social_connections 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.social_connections.avatar_url IS 
  'Profile picture URL from the connected social platform';