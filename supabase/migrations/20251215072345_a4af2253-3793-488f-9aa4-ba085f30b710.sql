-- Add funnel_type_snapshot column to projects table for tracking funnel changes
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS funnel_type_snapshot text;