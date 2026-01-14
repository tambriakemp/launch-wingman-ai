-- Remove overly permissive "always true" INSERT policies
-- Edge functions using service role key bypass RLS automatically,
-- so these policies are unnecessary and create security warnings

-- Drop the permissive policies from ai_usage_logs
DROP POLICY IF EXISTS "Service role can insert AI usage logs" ON public.ai_usage_logs;

-- Drop the permissive policies from email_logs
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;

-- Drop the permissive policies from webhook_logs (both duplicates)
DROP POLICY IF EXISTS "Service role can insert webhook logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "System can insert webhook logs" ON public.webhook_logs;

-- Drop the permissive policy from surecontact_webhook_logs
DROP POLICY IF EXISTS "System can insert surecontact webhook logs" ON public.surecontact_webhook_logs;

-- Drop the permissive policy from impersonation_logs if exists
DROP POLICY IF EXISTS "Service role can insert impersonation logs" ON public.impersonation_logs;
DROP POLICY IF EXISTS "System can insert impersonation logs" ON public.impersonation_logs;

-- Drop the permissive policy from admin_action_logs if exists (edge functions use service role)
DROP POLICY IF EXISTS "Service role can insert admin action logs" ON public.admin_action_logs;