-- Add column to track if relaunch nudge was dismissed
ALTER TABLE public.projects 
ADD COLUMN relaunch_nudge_dismissed boolean NOT NULL DEFAULT false;