
-- ai_usage_logs: remove user self-insert; writes go through edge functions (service role)
DROP POLICY IF EXISTS "Users can insert their own ai usage" ON public.ai_usage_logs;
-- Drop duplicate SELECT policies (keep one user + one admin)
DROP POLICY IF EXISTS "Users can view their own ai usage" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Admins can view all ai usage logs" ON public.ai_usage_logs;

-- user_activity: remove user self-insert; track-activity edge function uses service role
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activity;

-- video_credits: remove user insert/update; provisioning is server-side
DROP POLICY IF EXISTS "Users can insert their own video credits" ON public.video_credits;
DROP POLICY IF EXISTS "Users can update their own video credits" ON public.video_credits;

-- video_credit_transactions: remove user insert
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.video_credit_transactions;

-- integration_settings: restrict SELECT to admins, plus narrow allowlist of public-safe keys
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.integration_settings;
CREATE POLICY "Admins or public keys can read settings"
  ON public.integration_settings
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR key IN ('pinterest_environment', 'pinterest_sandbox_token')
  );
