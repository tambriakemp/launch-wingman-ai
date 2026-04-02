
CREATE OR REPLACE FUNCTION public.validate_task_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.task_scope NOT IN ('funnel_build', 'planner', 'both') THEN
    RAISE EXCEPTION 'Invalid task_scope: %', NEW.task_scope;
  END IF;
  IF NEW.task_origin NOT IN ('system', 'user') THEN
    RAISE EXCEPTION 'Invalid task_origin: %', NEW.task_origin;
  END IF;
  IF NEW.task_type NOT IN ('task', 'event') THEN
    RAISE EXCEPTION 'Invalid task_type: %', NEW.task_type;
  END IF;
  -- Allow any non-empty category string (custom categories supported)
  IF NEW.start_at IS NOT NULL AND NEW.end_at IS NULL THEN
    RAISE EXCEPTION 'end_at required when start_at is set';
  END IF;
  IF NEW.end_at IS NOT NULL AND NEW.start_at IS NULL THEN
    RAISE EXCEPTION 'start_at required when end_at is set';
  END IF;
  IF NEW.start_at IS NOT NULL AND NEW.end_at IS NOT NULL AND NEW.end_at < NEW.start_at THEN
    RAISE EXCEPTION 'end_at must be >= start_at';
  END IF;
  IF NEW.task_type = 'event' AND (NEW.start_at IS NULL OR NEW.end_at IS NULL) THEN
    RAISE EXCEPTION 'Events require start_at and end_at';
  END IF;
  RETURN NEW;
END;
$function$;
