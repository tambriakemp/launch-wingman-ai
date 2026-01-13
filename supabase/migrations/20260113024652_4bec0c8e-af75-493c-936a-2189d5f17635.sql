-- Create oauth_state table for PKCE code verifiers
CREATE TABLE IF NOT EXISTS public.oauth_state (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  code_verifier text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS
ALTER TABLE public.oauth_state ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own state
CREATE POLICY "Users can manage own oauth state" ON public.oauth_state
  FOR ALL USING (auth.uid() = user_id);

-- Index for auto-cleanup of expired state
CREATE INDEX idx_oauth_state_expires ON public.oauth_state(expires_at);