-- Part 1: Create trigger to auto-set funnel_type on new offers from project's selected_funnel_type
CREATE OR REPLACE FUNCTION public.set_offer_funnel_type()
RETURNS TRIGGER AS $$
BEGIN
  -- If funnel_type is not provided or is null, get it from the project
  IF NEW.funnel_type IS NULL THEN
    SELECT selected_funnel_type INTO NEW.funnel_type
    FROM public.projects
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_set_offer_funnel_type
  BEFORE INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_offer_funnel_type();

-- Part 2: Add unique constraint to prevent duplicate offers for same project/funnel_type/slot_type/slot_position
-- First, we need to clean up existing duplicates before adding the constraint
-- This is done by keeping only the most recent offer for each combination

-- Delete duplicates, keeping only the most recent one for each project/funnel_type/slot_type/slot_position
DELETE FROM public.offers a
USING public.offers b
WHERE a.project_id = b.project_id
  AND a.funnel_type = b.funnel_type
  AND a.slot_type = b.slot_type
  AND a.slot_position = b.slot_position
  AND a.created_at < b.created_at;

-- Now add the unique constraint
ALTER TABLE public.offers
ADD CONSTRAINT unique_offer_per_slot UNIQUE (project_id, funnel_type, slot_type, slot_position);