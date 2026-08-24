DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;
REVOKE INSERT, UPDATE, DELETE ON public.email_logs FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.email_logs FROM anon;
GRANT ALL ON public.email_logs TO service_role;