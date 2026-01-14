-- =====================================================
-- FIX SECURITY: Add proper RLS policies to sensitive tables
-- =====================================================

-- 1. ADMIN_ACTION_LOGS - Only admins can view
DROP POLICY IF EXISTS "Admins can view all admin action logs" ON public.admin_action_logs;
DROP POLICY IF EXISTS "Anyone can view admin action logs" ON public.admin_action_logs;

CREATE POLICY "Admins can view all admin action logs" 
ON public.admin_action_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert admin action logs" 
ON public.admin_action_logs 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. IMPERSONATION_LOGS - Only admins can view
DROP POLICY IF EXISTS "Admins can view impersonation logs" ON public.impersonation_logs;
DROP POLICY IF EXISTS "Anyone can view impersonation logs" ON public.impersonation_logs;

CREATE POLICY "Admins can view impersonation logs" 
ON public.impersonation_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert impersonation logs" 
ON public.impersonation_logs 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. USER_ACTIVITY - Only admins can view all, users see their own
DROP POLICY IF EXISTS "Admins can view all user activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Anyone can view user activity" ON public.user_activity;

CREATE POLICY "Admins can view all user activity" 
ON public.user_activity 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own activity" 
ON public.user_activity 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity" 
ON public.user_activity 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. AI_USAGE_LOGS - Users see their own, admins see all
DROP POLICY IF EXISTS "Admins can view all ai usage logs" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Users can view their own ai usage" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Anyone can view ai usage logs" ON public.ai_usage_logs;

CREATE POLICY "Admins can view all ai usage logs" 
ON public.ai_usage_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own ai usage" 
ON public.ai_usage_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai usage" 
ON public.ai_usage_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. EMAIL_LOGS - Users see their own, admins see all
DROP POLICY IF EXISTS "Admins can view all email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Anyone can view email logs" ON public.email_logs;

CREATE POLICY "Admins can view all email logs" 
ON public.email_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own email logs" 
ON public.email_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 6. WEBHOOK_LOGS - Only admins/managers can view
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Anyone can view webhook logs" ON public.webhook_logs;

CREATE POLICY "Admins can view webhook logs" 
ON public.webhook_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "System can insert webhook logs" 
ON public.webhook_logs 
FOR INSERT 
WITH CHECK (true);

-- 7. MARKETING_WEBHOOK_LOGS - Only admins/managers can view
DROP POLICY IF EXISTS "Admins can view marketing webhook logs" ON public.marketing_webhook_logs;
DROP POLICY IF EXISTS "Anyone can view marketing webhook logs" ON public.marketing_webhook_logs;

CREATE POLICY "Admins can view marketing webhook logs" 
ON public.marketing_webhook_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "System can insert marketing webhook logs" 
ON public.marketing_webhook_logs 
FOR INSERT 
WITH CHECK (true);

-- 8. SURECONTACT_WEBHOOK_LOGS - Only admins/managers can view
DROP POLICY IF EXISTS "Admins can view surecontact webhook logs" ON public.surecontact_webhook_logs;
DROP POLICY IF EXISTS "Anyone can view surecontact webhook logs" ON public.surecontact_webhook_logs;

CREATE POLICY "Admins can view surecontact webhook logs" 
ON public.surecontact_webhook_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "System can insert surecontact webhook logs" 
ON public.surecontact_webhook_logs 
FOR INSERT 
WITH CHECK (true);

-- 9. Ensure RLS is enabled on all these tables
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surecontact_webhook_logs ENABLE ROW LEVEL SECURITY;