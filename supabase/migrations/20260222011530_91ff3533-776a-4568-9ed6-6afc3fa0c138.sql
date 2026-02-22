
-- Table to store conversion events from tracking pixel
CREATE TABLE public.campaign_conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  revenue numeric DEFAULT 0,
  referrer text,
  ip_hash text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups by campaign
CREATE INDEX idx_campaign_conversions_campaign_id ON public.campaign_conversions(campaign_id);
CREATE INDEX idx_campaign_conversions_created_at ON public.campaign_conversions(created_at);

-- Enable RLS
ALTER TABLE public.campaign_conversions ENABLE ROW LEVEL SECURITY;

-- The pixel endpoint inserts via service role, so no INSERT policy needed for anon
-- Campaign owners can read their own conversions (campaign must belong to them)
CREATE POLICY "Users can view conversions for their campaigns"
  ON public.campaign_conversions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_conversions.campaign_id
      AND c.user_id = auth.uid()
    )
  );

-- Allow service role inserts (edge function uses service role key)
-- No public INSERT policy needed since the pixel endpoint uses service_role
CREATE POLICY "Service role can insert conversions"
  ON public.campaign_conversions
  FOR INSERT
  WITH CHECK (true);
