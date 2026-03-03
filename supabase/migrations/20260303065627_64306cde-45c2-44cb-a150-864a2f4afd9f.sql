
-- Fix get_social_connections_for_user to validate caller authorization
-- When called from client (auth.uid() is set), must match p_user_id
-- When called from service role (edge functions), auth.uid() is NULL, allowed through
-- Edge functions already validate JWT before calling this
CREATE OR REPLACE FUNCTION public.get_social_connections_for_user(p_user_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, platform text, access_token text, refresh_token text, account_id text, account_name text, page_id text, avatar_url text, token_expires_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Authorization check: if called from a client session (not service role),
  -- ensure the caller can only access their own connections
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: you can only access your own social connections';
  END IF;

  RETURN QUERY
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
  WHERE sc.user_id = p_user_id;
END;
$function$;
