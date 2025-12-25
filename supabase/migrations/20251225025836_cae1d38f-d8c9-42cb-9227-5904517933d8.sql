-- Drop the old check constraint and add a new one with all funnel types
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_selected_funnel_type_check;

ALTER TABLE public.projects ADD CONSTRAINT projects_selected_funnel_type_check 
CHECK (
  selected_funnel_type IS NULL OR 
  selected_funnel_type IN (
    'webinar', 'challenge', 'direct-sales', 'lead-magnet',
    'freebie_email_offer', 'live_training_offer', 'application_call'
  )
);