-- Add platform selection columns to offers table
ALTER TABLE public.offers
ADD COLUMN funnel_platform TEXT DEFAULT NULL,
ADD COLUMN community_platform TEXT DEFAULT NULL;