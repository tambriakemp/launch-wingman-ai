-- Create surecontact webhook logs table
CREATE TABLE public.surecontact_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  subscription_status TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  response_status INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surecontact_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins can view surecontact logs" ON public.surecontact_webhook_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ));