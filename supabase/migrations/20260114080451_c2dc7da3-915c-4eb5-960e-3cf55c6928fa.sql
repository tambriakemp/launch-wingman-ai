-- Drop the view that caused the security definer issue
DROP VIEW IF EXISTS public.social_connections_decrypted;

-- Create a secure function instead that returns user's own connections only
CREATE OR REPLACE FUNCTION public.get_user_social_connections()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  platform text,
  access_token text,
  refresh_token text,
  account_id text,
  account_name text,
  page_id text,
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
    sc.token_expires_at,
    sc.created_at,
    sc.updated_at
  FROM public.social_connections sc
  WHERE sc.user_id = auth.uid()
$$;

-- Recreate the view using the secure function (this will be security invoker by default)
CREATE OR REPLACE VIEW public.social_connections_decrypted 
WITH (security_invoker = true) AS
SELECT * FROM public.get_user_social_connections();

-- Grant access
REVOKE ALL ON public.social_connections_decrypted FROM anon;
REVOKE ALL ON public.social_connections_decrypted FROM public;
GRANT SELECT ON public.social_connections_decrypted TO authenticated;