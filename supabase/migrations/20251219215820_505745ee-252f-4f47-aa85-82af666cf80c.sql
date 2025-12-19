-- Enable RLS on the social_connections_decrypted view
ALTER VIEW public.social_connections_decrypted SET (security_invoker = on);

-- Note: Views with security_invoker inherit RLS from underlying tables
-- The social_connections table already has proper RLS policies that restrict access to own data
-- With security_invoker=on, queries through this view will respect those policies