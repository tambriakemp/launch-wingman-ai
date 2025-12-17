-- Fix: Add RLS protection to the social_connections_decrypted view
-- The view decrypts tokens and needs to be protected so users can only see their own data

-- Drop and recreate the view with security_invoker to inherit RLS from base table
DROP VIEW IF EXISTS public.social_connections_decrypted;

CREATE VIEW public.social_connections_decrypted 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  platform,
  public.decrypt_token(access_token) as access_token,
  public.decrypt_token(refresh_token) as refresh_token,
  token_expires_at,
  account_name,
  account_id,
  created_at,
  updated_at
FROM public.social_connections;