-- Add user_tier column to track if ticket submitter is free or pro
ALTER TABLE public.support_tickets 
ADD COLUMN user_tier text NOT NULL DEFAULT 'free' CHECK (user_tier IN ('free', 'pro'));