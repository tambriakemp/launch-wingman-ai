
-- Social links table
CREATE TABLE public.linkinbio_social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position INTEGER NOT NULL DEFAULT 0,
  platform TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '#',
  icon_name TEXT NOT NULL DEFAULT 'Link2',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.linkinbio_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social links" ON public.linkinbio_social_links FOR SELECT USING (true);
CREATE POLICY "Admins can manage social links" ON public.linkinbio_social_links FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Global branding settings table
CREATE TABLE public.linkinbio_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.linkinbio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.linkinbio_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.linkinbio_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default branding values
INSERT INTO public.linkinbio_settings (setting_key, setting_value) VALUES
  ('page_bg_color', '#0A0A0A'),
  ('card_bg_color', '#1C1C1E'),
  ('card_border_color', '#2A2A2C'),
  ('button_bg_color', '#FFFFFF'),
  ('button_text_color', '#0A0A0A'),
  ('accent_color', '#C9A96E'),
  ('heading_text_color', '#FFFFFF'),
  ('body_text_color', '#9A9A9A'),
  ('brand_name', 'Launchely'),
  ('bio_text', 'Laid off tech girl building in public 🛠️  |  Life habits + launch tools 👇🏽'),
  ('hero_image_url', 'https://picsum.photos/seed/launchely-hero/600/800'),
  ('footer_text', '© 2025 Launchely');
