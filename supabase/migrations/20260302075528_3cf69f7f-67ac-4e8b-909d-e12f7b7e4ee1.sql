
-- Video credits table
CREATE TABLE public.video_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  monthly_free_remaining INTEGER NOT NULL DEFAULT 10,
  monthly_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 month'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.video_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video credits"
  ON public.video_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video credits"
  ON public.video_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video credits"
  ON public.video_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role needs to manage credits from edge functions
-- (edge functions use service role key)

-- Video credit transactions (audit log)
CREATE TABLE public.video_credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'used',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.video_credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.video_credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User API keys table (for BYOK)
CREATE TABLE public.user_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service TEXT NOT NULL,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service)
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own api keys"
  ON public.user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own api keys"
  ON public.user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own api keys"
  ON public.user_api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own api keys"
  ON public.user_api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_video_credits_updated_at
  BEFORE UPDATE ON public.video_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
