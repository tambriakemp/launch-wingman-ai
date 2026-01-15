-- Add pinterest_sandbox_token to integration_settings if it doesn't exist
INSERT INTO integration_settings (key, value)
VALUES ('pinterest_sandbox_token', '')
ON CONFLICT (key) DO NOTHING;