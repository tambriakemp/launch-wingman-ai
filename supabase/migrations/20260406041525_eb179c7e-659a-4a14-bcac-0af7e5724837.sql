ALTER TABLE public.calendar_connections ADD COLUMN IF NOT EXISTS feed_token TEXT UNIQUE;

-- Create index for fast feed token lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_feed_token ON public.calendar_connections(feed_token) WHERE feed_token IS NOT NULL;