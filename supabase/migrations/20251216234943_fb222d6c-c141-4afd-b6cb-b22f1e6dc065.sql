-- Create user_activity table for tracking login history and last active
CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL DEFAULT 'login',
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view all user activity"
ON public.user_activity
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Service role can insert activity (for edge functions)
CREATE POLICY "Service role can insert activity"
ON public.user_activity
FOR INSERT
WITH CHECK (true);

-- Add last_active column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active timestamp with time zone;