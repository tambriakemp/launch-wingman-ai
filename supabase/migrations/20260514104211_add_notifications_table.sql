-- In-app notification surface — what the bell icon on the dashboard and
-- TopBar opens. Independent from push tokens (push_devices table); push
-- notifications can fan out to write rows here as a record, but the table
-- works on its own.

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'general',
  title       TEXT NOT NULL,
  body        TEXT,
  url         TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Most queries are "list for user, newest first".
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

-- Unread-count badge query.
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id) WHERE read_at IS NULL;

-- RLS — users see and update only their own rows. Service role bypasses
-- RLS by default, so edge functions writing notifications work without an
-- INSERT policy. No INSERT policy means clients can't create notifications.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);
