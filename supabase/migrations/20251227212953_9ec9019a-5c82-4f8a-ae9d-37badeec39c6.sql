-- Add column to track relaunch invitation sent per project
ALTER TABLE public.projects 
ADD COLUMN relaunch_invite_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;