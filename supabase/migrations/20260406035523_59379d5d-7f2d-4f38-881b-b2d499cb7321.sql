
-- Create calendar_connections table
CREATE TABLE public.calendar_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  account_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- Create calendar_sync_mappings table
CREATE TABLE public.calendar_sync_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  calendar_connection_id UUID REFERENCES public.calendar_connections(id) ON DELETE CASCADE NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, calendar_connection_id)
);

-- Enable RLS
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_mappings ENABLE ROW LEVEL SECURITY;

-- RLS for calendar_connections
CREATE POLICY "Users can view own calendar connections"
  ON public.calendar_connections FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own calendar connections"
  ON public.calendar_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own calendar connections"
  ON public.calendar_connections FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own calendar connections"
  ON public.calendar_connections FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS for calendar_sync_mappings
CREATE POLICY "Users can view own sync mappings"
  ON public.calendar_sync_mappings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sync mappings"
  ON public.calendar_sync_mappings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sync mappings"
  ON public.calendar_sync_mappings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sync mappings"
  ON public.calendar_sync_mappings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Updated_at trigger for calendar_connections
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON public.calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
