-- Fix the security definer view warning by using SECURITY INVOKER
-- This ensures RLS policies from the base table are applied

DROP VIEW IF EXISTS public.social_connections_decrypted;

CREATE VIEW public.social_connections_decrypted 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  platform,
  decrypt_token(access_token) as access_token,
  decrypt_token(refresh_token) as refresh_token,
  token_expires_at,
  account_name,
  account_id,
  created_at,
  updated_at
FROM public.social_connections;

COMMENT ON VIEW public.social_connections_decrypted IS 'View that automatically decrypts OAuth tokens with RLS from base table';