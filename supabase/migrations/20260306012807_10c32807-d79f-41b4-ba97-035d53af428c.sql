
ALTER TABLE public.tasks
  ADD COLUMN task_origin TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN task_scope TEXT NOT NULL DEFAULT 'funnel_build',
  ADD COLUMN task_type TEXT NOT NULL DEFAULT 'task',
  ADD COLUMN category TEXT NULL,
  ADD COLUMN due_at TIMESTAMPTZ NULL,
  ADD COLUMN start_at TIMESTAMPTZ NULL,
  ADD COLUMN end_at TIMESTAMPTZ NULL,
  ADD COLUMN location TEXT NULL,
  ADD COLUMN linked_entity_type TEXT NULL,
  ADD COLUMN linked_entity_id UUID NULL;
