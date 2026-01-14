-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to sync new user to SureContact
CREATE OR REPLACE FUNCTION public.sync_new_user_to_surecontact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Get environment variables
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);

  -- If we can't get settings, try a direct approach using net.http_post
  -- Call the surecontact-webhook edge function
  PERFORM extensions.http_post(
    url := 'https://ydhagqgurqhlguxkkppb.supabase.co/functions/v1/surecontact-webhook',
    body := jsonb_build_object(
      'action', 'sync_new_signup',
      'email', user_email,
      'first_name', COALESCE(NEW.first_name, ''),
      'last_name', COALESCE(NEW.last_name, '')
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to sync user to SureContact: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on profiles table for new user signups
DROP TRIGGER IF EXISTS trigger_sync_new_user_to_surecontact ON public.profiles;
CREATE TRIGGER trigger_sync_new_user_to_surecontact
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_new_user_to_surecontact();