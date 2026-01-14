-- Create integration_settings table for admin-controlled environment settings
CREATE TABLE public.integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default Pinterest environment as production
INSERT INTO integration_settings (key, value) VALUES ('pinterest_environment', 'production');

-- Enable Row Level Security
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings
CREATE POLICY "Authenticated users can read settings"
ON integration_settings FOR SELECT
TO authenticated
USING (true);

-- Only admins can update settings
CREATE POLICY "Only admins can update settings"
ON integration_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Only admins can insert new settings
CREATE POLICY "Only admins can insert settings"
ON integration_settings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_integration_settings_updated_at
BEFORE UPDATE ON integration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();