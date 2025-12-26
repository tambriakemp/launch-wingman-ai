-- Drop the existing constraint that's missing funnel types
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_selected_funnel_type_check;

-- Add updated constraint with all valid funnel types
ALTER TABLE projects ADD CONSTRAINT projects_selected_funnel_type_check 
CHECK (
  selected_funnel_type IS NULL OR 
  selected_funnel_type = ANY (ARRAY[
    'content_to_offer',
    'freebie_email_offer',
    'live_training_offer',
    'application_call',
    'membership',
    'challenge',
    'launch'
  ])
);