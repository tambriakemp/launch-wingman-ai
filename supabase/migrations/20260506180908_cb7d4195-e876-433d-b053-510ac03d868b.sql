-- push_devices
CREATE TABLE public.push_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios','android','web')),
  token TEXT NOT NULL,
  device_name TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);
CREATE INDEX idx_push_devices_user ON public.push_devices(user_id) WHERE disabled_at IS NULL;

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own devices" ON public.push_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own devices" ON public.push_devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own devices" ON public.push_devices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own devices" ON public.push_devices FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_push_devices_updated_at
BEFORE UPDATE ON public.push_devices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('task_due','habit_reminder','in_app','goal','custom')),
  title TEXT NOT NULL,
  body TEXT,
  deeplink TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_pending
  ON public.notifications(user_id, scheduled_for)
  WHERE delivered_at IS NULL;
CREATE INDEX idx_notifications_source ON public.notifications(source_id) WHERE source_id IS NOT NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: when a notification is inserted and already due, enqueue for dispatch
CREATE OR REPLACE FUNCTION public.enqueue_push_dispatch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.delivered_at IS NULL AND NEW.scheduled_for <= now() THEN
    BEGIN
      PERFORM pgmq.send('push_dispatch', jsonb_build_object('notification_id', NEW.id));
    EXCEPTION WHEN undefined_table THEN
      PERFORM pgmq.create('push_dispatch');
      PERFORM pgmq.send('push_dispatch', jsonb_build_object('notification_id', NEW.id));
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notifications_enqueue_dispatch
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_dispatch();

-- Ensure queue exists
DO $$ BEGIN
  PERFORM pgmq.create('push_dispatch');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;