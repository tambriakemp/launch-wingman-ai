-- Update the status check constraint to support new lifecycle states
ALTER TABLE projects DROP CONSTRAINT projects_status_check;

ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status = ANY (ARRAY['draft'::text, 'in_progress'::text, 'launched'::text, 'completed'::text, 'paused'::text, 'archived'::text, 'active'::text, 'planning'::text]));

-- Update the current project with legacy status to launched
UPDATE projects 
SET status = 'launched', active_phase = 'post-launch' 
WHERE status = 'active' AND id = '099d2104-cdd6-4098-bd94-ebbcf4295a59';