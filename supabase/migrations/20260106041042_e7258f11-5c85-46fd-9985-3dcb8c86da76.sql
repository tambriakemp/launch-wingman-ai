-- Create comprehensive admin action logs table
CREATE TABLE public.admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  admin_email text NOT NULL,
  target_user_id uuid,
  target_email text,
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Add indexes for faster queries
CREATE INDEX idx_admin_action_logs_created_at ON public.admin_action_logs(created_at DESC);
CREATE INDEX idx_admin_action_logs_action_type ON public.admin_action_logs(action_type);
CREATE INDEX idx_admin_action_logs_target_user ON public.admin_action_logs(target_user_id);

-- Enable RLS
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view action logs"
  ON public.admin_action_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add banned_until to profiles for account suspension
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_until timestamptz;