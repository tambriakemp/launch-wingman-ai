-- Update the trigger function to use @launchely.com instead of @cre8visions.com
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-assign admin role for launchely.com emails
  IF new.email LIKE '%@launchely.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin');
  END IF;
  RETURN new;
END;
$function$;