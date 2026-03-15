CREATE TABLE public.linkinbio_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_type text NOT NULL, -- 'social' or 'card_cta'
  link_id text NOT NULL,
  link_label text NOT NULL,
  link_url text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  referrer text,
  user_agent text
);

ALTER TABLE public.linkinbio_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public page, no auth required)
CREATE POLICY "Anyone can insert clicks" ON public.linkinbio_clicks
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only admins can read click data
CREATE POLICY "Admins can read clicks" ON public.linkinbio_clicks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));