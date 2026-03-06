
-- Validation trigger for task_scope
CREATE OR REPLACE FUNCTION public.validate_task_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
  IF NEW.category IS NOT NULL AND NEW.category NOT IN ('business', 'life') THEN
    RAISE EXCEPTION 'Invalid category: %', NEW.category;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_task_fields_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_task_fields();
