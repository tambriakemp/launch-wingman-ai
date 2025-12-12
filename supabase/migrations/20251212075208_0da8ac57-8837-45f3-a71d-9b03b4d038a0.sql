-- Add email marketing platform column to offers table
ALTER TABLE public.offers
ADD COLUMN email_platform TEXT DEFAULT NULL;