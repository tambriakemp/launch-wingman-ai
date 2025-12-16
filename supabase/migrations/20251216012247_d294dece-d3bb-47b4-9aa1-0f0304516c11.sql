-- Add column to track sales copy funnel type snapshot
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS sales_copy_funnel_snapshot text;