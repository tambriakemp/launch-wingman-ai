-- Add ON DELETE CASCADE to campaign_conversions FK
ALTER TABLE public.campaign_conversions
  DROP CONSTRAINT campaign_conversions_campaign_id_fkey;

ALTER TABLE public.campaign_conversions
  ADD CONSTRAINT campaign_conversions_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;

-- Also cascade utm_links if campaign is deleted
ALTER TABLE public.utm_links
  DROP CONSTRAINT IF EXISTS utm_links_campaign_id_fkey;

-- Check if FK exists first - if not, this is a no-op
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'utm_links_campaign_id_fkey'
  ) THEN
    ALTER TABLE public.utm_links DROP CONSTRAINT utm_links_campaign_id_fkey;
  END IF;
END $$;
