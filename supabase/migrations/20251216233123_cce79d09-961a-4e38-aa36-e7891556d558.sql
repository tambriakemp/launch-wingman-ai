-- Create impersonation audit logs table
CREATE TABLE public.impersonation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  target_user_id UUID NOT NULL,
  target_email TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'start', -- 'start' or 'end'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view impersonation logs
CREATE POLICY "Admins can view impersonation logs"
ON public.impersonation_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_impersonation_logs_admin ON public.impersonation_logs(admin_user_id);
CREATE INDEX idx_impersonation_logs_target ON public.impersonation_logs(target_user_id);
CREATE INDEX idx_impersonation_logs_created ON public.impersonation_logs(created_at DESC);