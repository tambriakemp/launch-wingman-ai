-- Create table to store marketing webhook activity logs
CREATE TABLE public.marketing_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  membership TEXT NOT NULL,
  tags_added TEXT[] DEFAULT '{}',
  tags_removed TEXT[] DEFAULT '{}',
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  response_status INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view webhook logs"
ON public.marketing_webhook_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Create index for faster queries
CREATE INDEX idx_marketing_webhook_logs_created_at ON public.marketing_webhook_logs (created_at DESC);
CREATE INDEX idx_marketing_webhook_logs_email ON public.marketing_webhook_logs (email);