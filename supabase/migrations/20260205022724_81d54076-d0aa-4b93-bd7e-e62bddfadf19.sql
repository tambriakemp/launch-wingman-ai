-- Add onboarding_completed_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;