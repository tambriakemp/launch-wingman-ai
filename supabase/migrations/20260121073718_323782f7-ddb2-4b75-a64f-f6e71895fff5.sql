-- Create payment_config table for storing provider configurations
CREATE TABLE public.payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, key)
);

-- Enable RLS on payment_config
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write payment_config
CREATE POLICY "Admins can manage payment_config"
ON public.payment_config
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add SureCart tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS surecart_customer_id TEXT,
ADD COLUMN IF NOT EXISTS surecart_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS surecart_subscription_status TEXT;

-- Create trigger for updated_at on payment_config
CREATE TRIGGER update_payment_config_updated_at
BEFORE UPDATE ON public.payment_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();