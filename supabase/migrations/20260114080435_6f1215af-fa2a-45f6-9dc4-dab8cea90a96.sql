-- Fix social_connections_decrypted view - replace with security definer function approach
-- Drop the existing view
DROP VIEW IF EXISTS public.social_connections_decrypted;

-- Create a secure view that respects RLS by using SECURITY INVOKER (default)
-- But we need to add RLS to the base table and ensure users can only see their own connections
CREATE OR REPLACE VIEW public.social_connections_decrypted AS
SELECT 
  id,
  user_id,
  platform,
  public.decrypt_token(access_token) as access_token,
  public.decrypt_token(refresh_token) as refresh_token,
  account_id,
  account_name,
  token_expires_at,
  created_at,
  updated_at
FROM public.social_connections
WHERE user_id = auth.uid();

-- Grant select to authenticated users only
REVOKE ALL ON public.social_connections_decrypted FROM anon;
REVOKE ALL ON public.social_connections_decrypted FROM public;
GRANT SELECT ON public.social_connections_decrypted TO authenticated;