
-- Add occurrence_date column for recurring task occurrence tracking
ALTER TABLE public.calendar_sync_mappings ADD COLUMN IF NOT EXISTS occurrence_date text;

-- Drop the old unique constraint
ALTER TABLE public.calendar_sync_mappings DROP CONSTRAINT IF EXISTS calendar_sync_mappings_task_id_calendar_connection_id_key;

-- Create new unique constraint including occurrence_date
ALTER TABLE public.calendar_sync_mappings ADD CONSTRAINT calendar_sync_mappings_task_conn_occ_unique UNIQUE (task_id, calendar_connection_id, occurrence_date);
