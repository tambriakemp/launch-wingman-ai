-- Create table to store SureContact configuration (tags, lists, custom fields UUIDs)
CREATE TABLE public.surecontact_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_type TEXT NOT NULL, -- 'tag', 'list', 'custom_field'
  name TEXT NOT NULL, -- e.g., 'free-user', 'master-list', 'subscription_status'
  surecontact_uuid TEXT NOT NULL, -- UUID from SureContact API
  metadata JSONB DEFAULT '{}', -- Additional metadata (e.g., tag color, field type)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(config_type, name)
);

-- Add index for faster lookups
CREATE INDEX idx_surecontact_config_type ON public.surecontact_config(config_type);
CREATE INDEX idx_surecontact_config_name ON public.surecontact_config(name);

-- Enable RLS
ALTER TABLE public.surecontact_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write surecontact config
CREATE POLICY "Admin can view surecontact config"
  ON public.surecontact_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can insert surecontact config"
  ON public.surecontact_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can update surecontact config"
  ON public.surecontact_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can delete surecontact config"
  ON public.surecontact_config
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager')
    )
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_surecontact_config_updated_at
  BEFORE UPDATE ON public.surecontact_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();