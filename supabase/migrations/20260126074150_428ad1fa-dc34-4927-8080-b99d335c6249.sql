-- Create a function that accepts user_id parameter for edge functions to query social connections
-- This bypasses the auth.uid() issue when using service role key
CREATE OR REPLACE FUNCTION public.get_social_connections_for_user(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  platform text,
  access_token text,
  refresh_token text,
  account_id text,
  account_name text,
  page_id text,
  avatar_url text,
  token_expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sc.id,
    sc.user_id,
    sc.platform,
    public.decrypt_token(sc.access_token) as access_token,
    public.decrypt_token(sc.refresh_token) as refresh_token,
    sc.account_id,
    sc.account_name,
    sc.page_id,
    sc.avatar_url,
    sc.token_expires_at,
    sc.created_at,
    sc.updated_at
  FROM public.social_connections sc
  WHERE sc.user_id = p_user_id
$$;